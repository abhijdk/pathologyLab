package com.pathologyLabSystem.Pathology.Lab.System.lab.service.inv;


import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.*;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.*;
import com.pathologyLabSystem.Pathology.Lab.System.lab.repository.inv.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ConsumableService {

    private final ItemMasterRepository itemRepo;
    private final VendorRepository vendorRepo;
    private final InventoryEntryRepository entryRepo;
    private final ConsumptionRepository consumptionRepo;
    private final PaymentRepository paymentRepo;

    // ==========================================
    // CREATE (POST) OPERATIONS
    // ==========================================

    @Transactional
    public ItemMaster createItemMaster(ItemMasterDTO dto) {
        ItemMaster item = new ItemMaster();
        item.setItemName(dto.getItemName());
        item.setStock(dto.getStock() != null ? dto.getStock() : 0);
        item.setSuffix(dto.getSuffix());
        return itemRepo.save(item);
    }

    @Transactional
    public Vendor createVendor(VendorDTO dto) {
        Vendor vendor = new Vendor();
        vendor.setVendorName(dto.getVendorName());
        vendor.setVendorMobile(dto.getVendorMobile());
        vendor.setVendorEmail(dto.getVendorEmail());
        vendor.setBalance(dto.getBalance() != null ? dto.getBalance() : BigDecimal.ZERO);
        return vendorRepo.save(vendor);
    }

    @Transactional
    public Consumption processConsumption(ConsumptionDTO dto) {
        ItemMaster item = itemRepo.findById(dto.getItemId())
                .orElseThrow(() -> new RuntimeException("Item not found"));

        Consumption cons = new Consumption();
        cons.setConsumptionDate(dto.getConsumptionDate());
        cons.setItemId(item.getItemId());
        cons.setItemName(item.getItemName());

        cons.setOpenStock(item.getStock() != null ? item.getStock() : 0);
        cons.setUsedQuantity(dto.getUsedQuantity());
        cons.setClosingStock(cons.getOpenStock() - cons.getUsedQuantity());

        cons.setUsedBy(dto.getUsedBy());
        cons.setRemarks(dto.getRemarks());

        item.setStock(cons.getClosingStock());
        itemRepo.save(item);
        return consumptionRepo.save(cons);
    }

    @Transactional
    public Payment processPayment(PaymentDTO dto) {
        Vendor vendor = vendorRepo.findById(dto.getVendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        Payment payment = new Payment();
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setVendorId(vendor.getVendorId());
        payment.setVendorName(vendor.getVendorName());

        BigDecimal currentBalance = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
        payment.setOpeningBalance(currentBalance);

        // MODIFIED: Save as -XXX in the database to reflect money going out
        BigDecimal uiPaidAmount = dto.getPaidAmount();
        payment.setPaidAmount(uiPaidAmount.negate());

        payment.setClosingBalance(currentBalance.subtract(uiPaidAmount));

        payment.setPaymentMode(dto.getPaymentMode());
        payment.setRemarks(dto.getRemarks());

        vendor.setBalance(payment.getClosingBalance());
        vendorRepo.save(vendor);
        return paymentRepo.save(payment);
    }

    @Transactional
    public List<InventoryEntry> processBatchInventory(PurchaseBillDTO dto) {
        Vendor vendor = vendorRepo.findById(dto.getVendorId()).orElseThrow(() -> new RuntimeException("Vendor not found"));

        BigDecimal currentBalance = vendor.getBalance() != null ? vendor.getBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = currentBalance.add(dto.getBillAmount());

        vendor.setBalance(newBalance);
        vendorRepo.save(vendor);

        // AUTO-CREATE PAYMENT (LEDGER) ENTRY
        Payment ledgerEntry = new Payment();
        ledgerEntry.setPaymentDate(dto.getEntryDate());
        ledgerEntry.setVendorId(vendor.getVendorId());
        ledgerEntry.setVendorName(vendor.getVendorName());
        ledgerEntry.setOpeningBalance(currentBalance);

        // MODIFIED: Show the Bill Amount as +XXX in the paidAmount column
        ledgerEntry.setPaidAmount(dto.getBillAmount());

        ledgerEntry.setClosingBalance(newBalance);
        ledgerEntry.setPaymentMode("BILL_ENTRY");
        ledgerEntry.setPaymentAgentVoucher(dto.getVoucherNumber());

        String ledgerRemarks = "NEW ENTITY PURCHASED";
        if (dto.getRemarks() != null && !dto.getRemarks().isEmpty()) {
            ledgerRemarks += " | " + dto.getRemarks();
        }
        ledgerEntry.setRemarks(ledgerRemarks);

        paymentRepo.save(ledgerEntry);

        List<InventoryEntry> savedEntries = new ArrayList<>();
        int numberOfItems = dto.getItems().size();
        BigDecimal apportionedGst = dto.getGst() != null ? dto.getGst().divide(new BigDecimal(numberOfItems), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        for (BillItemDTO itemDto : dto.getItems()) {
            ItemMaster item = itemRepo.findById(itemDto.getItemId()).orElseThrow(() -> new RuntimeException("Item not found"));

            InventoryEntry entry = new InventoryEntry();
            entry.setEntryDate(dto.getEntryDate());
            entry.setVendorId(vendor.getVendorId());
            entry.setVendorName(vendor.getVendorName());
            entry.setVoucherNumber(dto.getVoucherNumber());
            entry.setGst(apportionedGst);
            entry.setRemarks(dto.getRemarks());

            BigDecimal individualItemAmount = itemDto.getItemAmount() != null ? itemDto.getItemAmount() : BigDecimal.ZERO;
            entry.setBillAmount(individualItemAmount);

            entry.setItemId(item.getItemId());
            entry.setItemName(item.getItemName());
            entry.setOpeningBalance(item.getStock() != null ? item.getStock() : 0);

            int totalReceived = itemDto.getReceivedQuantityBox() * itemDto.getPerBoxQuantity();
            entry.setReceivedQuantityBox(itemDto.getReceivedQuantityBox());
            entry.setPerBoxQuantity(itemDto.getPerBoxQuantity());
            entry.setTotalQuantityReceived(totalReceived);
            entry.setClosingBalance(entry.getOpeningBalance() + totalReceived);

            if (totalReceived > 0) {
                BigDecimal perUnitCost = individualItemAmount.divide(new BigDecimal(totalReceived), 4, RoundingMode.HALF_UP);
                entry.setPerKitOrMlCost(perUnitCost);
            } else {
                entry.setPerKitOrMlCost(BigDecimal.ZERO);
            }

            item.setStock(entry.getClosingBalance());
            itemRepo.save(item);
            savedEntries.add(entryRepo.save(entry));
        }
        return savedEntries;
    }

    // ==========================================
    // GET (READ) OPERATIONS
    // ==========================================

    public List<ItemMaster> getAllItems() { return itemRepo.findAll(); }
    public ItemMaster getItemById(Long id) { return itemRepo.findById(id).orElseThrow(() -> new RuntimeException("Item not found")); }
    public List<Vendor> getAllVendors() { return vendorRepo.findAll(); }
    public Vendor getVendorById(Long id) { return vendorRepo.findById(id).orElseThrow(() -> new RuntimeException("Vendor not found")); }
    public List<InventoryEntry> getAllInventoryEntries() { return entryRepo.findAll(); }
    public List<Consumption> getAllConsumptions() { return consumptionRepo.findAll(); }
    public List<Payment> getAllPayments() { return paymentRepo.findAll(); }

    // ==========================================
    // UPDATE (PUT) OPERATIONS
    // ==========================================

    @Transactional
    public ItemMaster updateItem(Long id, ItemMasterDTO dto) {
        ItemMaster item = getItemById(id);
        item.setItemName(dto.getItemName());
        item.setSuffix(dto.getSuffix());
        return itemRepo.save(item);
    }

    @Transactional
    public Vendor updateVendor(Long id, VendorDTO dto) {
        Vendor vendor = getVendorById(id);
        vendor.setVendorName(dto.getVendorName());
        vendor.setVendorMobile(dto.getVendorMobile());
        vendor.setVendorEmail(dto.getVendorEmail());
        return vendorRepo.save(vendor);
    }

    @Transactional
    public Consumption updateConsumption(Long id, ConsumptionDTO dto) {
        Consumption cons = consumptionRepo.findById(id).orElseThrow(() -> new RuntimeException("Consumption not found"));
        ItemMaster oldItem = getItemById(cons.getItemId());

        oldItem.setStock(oldItem.getStock() + cons.getUsedQuantity());
        itemRepo.save(oldItem);

        ItemMaster newItem = getItemById(dto.getItemId());
        int newOpeningStock = newItem.getStock();

        newItem.setStock(newOpeningStock - dto.getUsedQuantity());
        itemRepo.save(newItem);

        cons.setItemId(newItem.getItemId());
        cons.setItemName(newItem.getItemName());
        cons.setUsedQuantity(dto.getUsedQuantity());
        cons.setConsumptionDate(dto.getConsumptionDate());
        cons.setUsedBy(dto.getUsedBy());
        cons.setRemarks(dto.getRemarks());

        cons.setOpenStock(newOpeningStock);
        cons.setClosingStock(newItem.getStock());

        return consumptionRepo.save(cons);
    }

    @Transactional
    public Payment updatePayment(Long id, PaymentDTO dto) {
        Payment payment = paymentRepo.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        Vendor oldVendor = getVendorById(payment.getVendorId());

        // 1. REVERSE OLD MATH
        // Because old payment is stored as negative, we must add its absolute value back to the debt
        BigDecimal oldPaidAmt = payment.getPaidAmount().abs();
        oldVendor.setBalance(oldVendor.getBalance().add(oldPaidAmt));
        vendorRepo.save(oldVendor);

        // 2. FETCH NEW VENDOR
        Vendor newVendor = getVendorById(dto.getVendorId());
        BigDecimal newOpeningBalance = newVendor.getBalance();

        // 3. APPLY NEW MATH
        BigDecimal newUiPaidAmount = dto.getPaidAmount();
        BigDecimal newClosingBalance = newOpeningBalance.subtract(newUiPaidAmount);
        newVendor.setBalance(newClosingBalance);
        vendorRepo.save(newVendor);

        // 4. UPDATE RECORD
        payment.setVendorId(newVendor.getVendorId());
        payment.setVendorName(newVendor.getVendorName());
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setPaymentMode(dto.getPaymentMode());

        // Save as -XXX
        payment.setPaidAmount(newUiPaidAmount.negate());

        payment.setRemarks(dto.getRemarks());
        payment.setOpeningBalance(newOpeningBalance);
        payment.setClosingBalance(newClosingBalance);

        return paymentRepo.save(payment);
    }

    @Transactional
    public InventoryEntry updateInventoryEntry(Long id, PurchaseBillDTO dto) {
        InventoryEntry entry = entryRepo.findById(id).orElseThrow(() -> new RuntimeException("Entry not found"));
        ItemMaster oldItem = getItemById(entry.getItemId());
        Vendor vendor = getVendorById(entry.getVendorId());

        BigDecimal originalBillAmount = entry.getBillAmount();

        oldItem.setStock(oldItem.getStock() - entry.getTotalQuantityReceived());
        BigDecimal reversedBalance = vendor.getBalance().subtract(originalBillAmount);

        BigDecimal finalBalance = reversedBalance.add(dto.getBillAmount());
        vendor.setBalance(finalBalance);

        BillItemDTO itemDto = dto.getItems().get(0);
        ItemMaster newItem = getItemById(itemDto.getItemId());
        int newOpeningStock = newItem.getStock();

        int newTotalReceived = itemDto.getReceivedQuantityBox() * itemDto.getPerBoxQuantity();
        newItem.setStock(newOpeningStock + newTotalReceived);

        itemRepo.save(oldItem);
        itemRepo.save(newItem);
        vendorRepo.save(vendor);

        // AUTO-LOG THE CORRECTION IN PAYMENT LEDGER
        if (originalBillAmount.compareTo(dto.getBillAmount()) != 0) {
            Payment correctionLedger = new Payment();
            correctionLedger.setPaymentDate(dto.getEntryDate());
            correctionLedger.setVendorId(vendor.getVendorId());
            correctionLedger.setVendorName(vendor.getVendorName());
            correctionLedger.setOpeningBalance(reversedBalance);

            // MODIFIED: Show the edited Bill Amount as +XXX
            correctionLedger.setPaidAmount(dto.getBillAmount());

            correctionLedger.setClosingBalance(finalBalance);
            correctionLedger.setPaymentMode("BILL_EDITED");
            correctionLedger.setPaymentAgentVoucher(dto.getVoucherNumber());
            correctionLedger.setRemarks("EDIT CORRECTION. New Bill: ₹" + dto.getBillAmount());
            paymentRepo.save(correctionLedger);
        }

        entry.setEntryDate(dto.getEntryDate());
        entry.setVoucherNumber(dto.getVoucherNumber());
        entry.setGst(dto.getGst());
        entry.setRemarks(dto.getRemarks());

        BigDecimal individualItemAmount = itemDto.getItemAmount() != null ? itemDto.getItemAmount() : dto.getBillAmount();
        entry.setBillAmount(individualItemAmount);

        entry.setItemId(newItem.getItemId());
        entry.setItemName(newItem.getItemName());
        entry.setReceivedQuantityBox(itemDto.getReceivedQuantityBox());
        entry.setPerBoxQuantity(itemDto.getPerBoxQuantity());
        entry.setTotalQuantityReceived(newTotalReceived);

        entry.setOpeningBalance(newOpeningStock);
        entry.setClosingBalance(newItem.getStock());

        if (newTotalReceived > 0) {
            BigDecimal perUnitCost = individualItemAmount.divide(new BigDecimal(newTotalReceived), 4, RoundingMode.HALF_UP);
            entry.setPerKitOrMlCost(perUnitCost);
        }

        return entryRepo.save(entry);
    }
}