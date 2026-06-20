package com.pathologyLabSystem.Pathology.Lab.System.lab.service.inv;


import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.*;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.*;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.inv.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NonConsumableService {

    private final NonConsumableItemRepository itemRepo;
    private final NonConsumableDestroyRepository destroyRepo;
    private final NonConsumableMaintenanceRepository maintenanceRepo;
    private final NonConsumableEntryRepository entryRepo;

    // Core shared tables for accounting
    private final VendorRepository vendorRepo;
    private final PaymentRepository paymentRepo;



    @Transactional
    public NonConsumableEntry processEntry(NonConsumableEntryDTO dto) {
        NonConsumableItem item = itemRepo.findById(dto.getItemId()).orElseThrow(() -> new RuntimeException("Item not found"));
        Vendor vendor = vendorRepo.findById(dto.getVendorId()).orElseThrow(() -> new RuntimeException("Vendor not found"));

        // ========================================================
        // 1. VENDOR BALANCE UPDATE
        // ========================================================
        BigDecimal currentBalance = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = currentBalance.add(dto.getBillAmount());
        vendor.setBalance(newBalance);
        vendorRepo.save(vendor);

        // ========================================================
        // 2. CREATE PAYMENT LEDGER ENTRY (Shared Table)
        // ========================================================
        Payment ledgerEntry = new Payment();
        ledgerEntry.setPaymentDate(dto.getEntryDate());
        ledgerEntry.setVendorId(vendor.getVendorId());
        ledgerEntry.setVendorName(vendor.getVendorName());
        ledgerEntry.setOpeningBalance(currentBalance);

        // Show the Bill Amount as +XXX to represent added debt
        ledgerEntry.setPaidAmount(dto.getBillAmount());

        ledgerEntry.setClosingBalance(newBalance);
        ledgerEntry.setPaymentMode("NON_CON_BILL_ENTRY");
        ledgerEntry.setPaymentAgentVoucher(dto.getVoucherNumber());

        String ledgerRemarks = "NON-CONSUMABLE PURCHASE";
        if (dto.getRemarks() != null && !dto.getRemarks().isEmpty()) {
            ledgerRemarks += " | " + dto.getRemarks();
        }
        ledgerEntry.setRemarks(ledgerRemarks);
        paymentRepo.save(ledgerEntry);

        // ========================================================
        // 3. CREATE INVENTORY ENTRY
        // ========================================================
        NonConsumableEntry entry = new NonConsumableEntry();
        entry.setEntryDate(dto.getEntryDate());
        entry.setItemId(item.getItemId());
        entry.setItemName(item.getItemName());
        entry.setVendorId(vendor.getVendorId());
        entry.setVendorName(vendor.getVendorName());

        // Stock Logic
        entry.setOpeningBalance(item.getStock() != null ? item.getStock() : 0);
        int totalReceived = dto.getReceivedQuantityBox() * dto.getPerBoxQuantity();
        entry.setReceivedQuantityBox(dto.getReceivedQuantityBox());
        entry.setPerBoxQuantity(dto.getPerBoxQuantity());
        entry.setTotalQuantityReceived(totalReceived);
        entry.setClosingBalance(entry.getOpeningBalance() + totalReceived);

        // Cost Logic
        entry.setBillAmount(dto.getBillAmount());
        if (totalReceived > 0) {
            entry.setPerKitOrMlCost(dto.getBillAmount().divide(new BigDecimal(totalReceived), 4, RoundingMode.HALF_UP));
        } else {
            entry.setPerKitOrMlCost(BigDecimal.ZERO);
        }

        entry.setVoucherNumber(dto.getVoucherNumber());
        entry.setGst(dto.getGst());
        entry.setRepresentativeName(dto.getRepresentativeName());
        entry.setRemarks(dto.getRemarks());

        // Update Item Stock
        item.setStock(entry.getClosingBalance());
        itemRepo.save(item);

        return entryRepo.save(entry);
    }

    @Transactional
    public NonConsumableDestroy processDestroy(NonConsumableDestroyDTO dto) {
        NonConsumableItem item = itemRepo.findById(dto.getNciId()).orElseThrow(() -> new RuntimeException("Item not found"));

        NonConsumableDestroy destroy = new NonConsumableDestroy();
        destroy.setDate(dto.getDate());
        destroy.setNciId(item.getItemId());
        destroy.setItemName(item.getItemName());

        // Logic
        destroy.setOpeningBalance(item.getStock() != null ? item.getStock() : 0);
        destroy.setDestroyQuantity(dto.getDestroyQuantity());
        destroy.setClosingBalance(destroy.getOpeningBalance() - dto.getDestroyQuantity());

        destroy.setDestroyedBy(dto.getDestroyedBy());
        destroy.setRemark(dto.getRemark());

        // Update Item Stock
        item.setStock(destroy.getClosingBalance());
        itemRepo.save(item);

        return destroyRepo.save(destroy);
    }



    @Transactional
    public NonConsumableItem createItem(NonConsumableItemDTO dto) {
        NonConsumableItem item = new NonConsumableItem();
        item.setDate(dto.getDate());
        item.setItemName(dto.getItemName());
        item.setItemSerialNumber(dto.getItemSerialNumber());
        item.setItemOptional(dto.getItemOptional());
        item.setStock(dto.getStock() != null ? dto.getStock() : 0);
        item.setMaintenanceNextDate(dto.getMaintenanceNextDate());
        item.setMaintenanceDurationMonths(dto.getMaintenanceDurationMonths());
        return itemRepo.save(item);
    }

    @Transactional
    public NonConsumableMaintenance processMaintenance(NonConsumableMaintenanceDTO dto) {
        NonConsumableItem item = itemRepo.findById(dto.getNiId())
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (item.getMaintenanceDurationMonths() != null && item.getMaintenanceDurationMonths() > 0) {
            LocalDate newNextService = LocalDate.now().plusMonths(item.getMaintenanceDurationMonths());
            item.setMaintenanceNextDate(newNextService);
            itemRepo.save(item);
        }

        NonConsumableMaintenance maintenance = new NonConsumableMaintenance();
        maintenance.setDate(dto.getDate());
        maintenance.setNiId(item.getItemId());
        maintenance.setItemName(item.getItemName());
        maintenance.setSerialNumber(item.getItemSerialNumber());
        maintenance.setEngineerName(dto.getEngineerName());
        maintenance.setPresenceOfStaff(dto.getPresenceOfStaff());
        maintenance.setMaintenanceAmount(dto.getMaintenanceAmount());
        maintenance.setRemarks(dto.getRemarks());
        return maintenanceRepo.save(maintenance);
    }

    @Transactional
    public List<NonConsumableEntry> processBatchInventory(PurchaseBillDTO dto) {
        Vendor vendor = vendorRepo.findById(dto.getVendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        BigDecimal currentBalance = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = currentBalance.add(dto.getBillAmount());
        vendor.setBalance(newBalance);
        vendorRepo.save(vendor);

        Payment ledgerEntry = new Payment();
        ledgerEntry.setPaymentDate(dto.getEntryDate());
        ledgerEntry.setVendorId(vendor.getVendorId());
        ledgerEntry.setVendorName(vendor.getVendorName());
        ledgerEntry.setOpeningBalance(currentBalance);
        ledgerEntry.setPaidAmount(dto.getBillAmount());
        ledgerEntry.setClosingBalance(newBalance);
        ledgerEntry.setPaymentMode("NON_CON_BILL_ENTRY");
        ledgerEntry.setPaymentAgentVoucher(dto.getVoucherNumber());
        ledgerEntry.setRemarks("NON-CONSUMABLE PURCHASE | " + dto.getRemarks());
        paymentRepo.save(ledgerEntry);

        List<NonConsumableEntry> savedEntries = new ArrayList<>();

        for (BillItemDTO itemDto : dto.getItems()) {
            NonConsumableItem item = itemRepo.findById(itemDto.getItemId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));

            NonConsumableEntry entry = new NonConsumableEntry();
            entry.setEntryDate(dto.getEntryDate());
            entry.setItemId(item.getItemId());
            entry.setItemName(item.getItemName());
            entry.setVendorId(vendor.getVendorId());
            entry.setVendorName(vendor.getVendorName());
            entry.setVoucherNumber(dto.getVoucherNumber());
            entry.setRemarks(dto.getRemarks());
            entry.setBillAmount(itemDto.getItemAmount());

            int totalReceived = itemDto.getReceivedQuantityBox() * itemDto.getPerBoxQuantity();
            entry.setOpeningBalance(item.getStock());
            entry.setClosingBalance(item.getStock() + totalReceived);

            item.setStock(entry.getClosingBalance());
            itemRepo.save(item);
            savedEntries.add(entryRepo.save(entry));
        }
        return savedEntries;
    }

    @Transactional
    public NonConsumableItem updateItem(Long id, NonConsumableItemDTO dto) {
        NonConsumableItem item = itemRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        item.setDate(dto.getDate());
        item.setItemName(dto.getItemName());
        item.setItemSerialNumber(dto.getItemSerialNumber());
        item.setItemOptional(dto.getItemOptional());
        item.setStock(dto.getStock() != null ? dto.getStock() : 0);
        item.setMaintenanceDurationMonths(dto.getMaintenanceDurationMonths());
        item.setMaintenanceNextDate(dto.getMaintenanceNextDate());

        return itemRepo.save(item);
    }

    // Getters and Destroy process remain as you had them...
    public List<NonConsumableItem> getAllItems() { return itemRepo.findAll(); }
    public List<NonConsumableEntry> getAllEntries() { return entryRepo.findAll(); }
    public List<NonConsumableDestroy> getAllDestroys() { return destroyRepo.findAll(); }
    public List<NonConsumableMaintenance> getAllMaintenanceLogs() { return maintenanceRepo.findAll(); }
}


