package com.pathologyLabSystem.Pathology.Lab.System.lab.controller.inv;


import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.*;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.*;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.inv.ConsumableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/consumable/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ConsumableController {

    private final ConsumableService inventoryService;

    // ==========================================
    // GET ENDPOINTS
    // ==========================================

    @GetMapping("/items")
    public ResponseEntity<List<ItemMaster>> getAllItems() {
        return ResponseEntity.ok(inventoryService.getAllItems());
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ItemMaster> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getItemById(id));
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<Vendor>> getAllVendors() {
        return ResponseEntity.ok(inventoryService.getAllVendors());
    }

    @GetMapping("/entry")
    public ResponseEntity<List<InventoryEntry>> getAllEntries() {
        return ResponseEntity.ok(inventoryService.getAllInventoryEntries());
    }

    @GetMapping("/consume")
    public ResponseEntity<List<Consumption>> getAllConsumptions() {
        return ResponseEntity.ok(inventoryService.getAllConsumptions());
    }

    @GetMapping("/payment")
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(inventoryService.getAllPayments());
    }

    // ==========================================
    // POST ENDPOINTS (CREATE)
    // ==========================================

    @PostMapping("/items")
    public ResponseEntity<ItemMaster> createItem(@RequestBody ItemMasterDTO dto) {
        return ResponseEntity.ok(inventoryService.createItemMaster(dto));
    }

    @PostMapping("/vendors")
    public ResponseEntity<Vendor> createVendor(@RequestBody VendorDTO dto) {
        return ResponseEntity.ok(inventoryService.createVendor(dto));
    }

    @PostMapping("/entry/batch")
    public ResponseEntity<List<InventoryEntry>> createBatchInventoryEntry(@RequestBody PurchaseBillDTO dto) {
        return ResponseEntity.ok(inventoryService.processBatchInventory(dto));
    }

    @PostMapping("/consume")
    public ResponseEntity<Consumption> logConsumption(@RequestBody ConsumptionDTO dto) {
        return ResponseEntity.ok(inventoryService.processConsumption(dto));
    }

    @PostMapping("/payment")
    public ResponseEntity<Payment> makePayment(@RequestBody PaymentDTO dto) {
        return ResponseEntity.ok(inventoryService.processPayment(dto));
    }

    // ==========================================
    // PUT ENDPOINTS (UPDATE / EDIT)
    // ==========================================

    @PutMapping("/items/{id}")
    public ResponseEntity<ItemMaster> updateItem(@PathVariable Long id, @RequestBody ItemMasterDTO dto) {
        return ResponseEntity.ok(inventoryService.updateItem(id, dto));
    }

    @PutMapping("/vendors/{id}")
    public ResponseEntity<Vendor> updateVendor(@PathVariable Long id, @RequestBody VendorDTO dto) {
        return ResponseEntity.ok(inventoryService.updateVendor(id, dto));
    }

    @PutMapping("/entry/{id}")
    public ResponseEntity<InventoryEntry> updateInventoryEntry(@PathVariable Long id, @RequestBody PurchaseBillDTO dto) {
        return ResponseEntity.ok(inventoryService.updateInventoryEntry(id, dto));
    }

    @PutMapping("/consume/{id}")
    public ResponseEntity<Consumption> updateConsumption(@PathVariable Long id, @RequestBody ConsumptionDTO dto) {
        return ResponseEntity.ok(inventoryService.updateConsumption(id, dto));
    }

    @PutMapping("/payment/{id}")
    public ResponseEntity<Payment> updatePayment(@PathVariable Long id, @RequestBody PaymentDTO dto) {
        return ResponseEntity.ok(inventoryService.updatePayment(id, dto));
    }

    // NO DELETE ENDPOINTS ALLOWED AS PER REQUIREMENTS
}