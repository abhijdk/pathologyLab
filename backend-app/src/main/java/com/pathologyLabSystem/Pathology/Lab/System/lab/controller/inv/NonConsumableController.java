package com.pathologyLabSystem.Pathology.Lab.System.lab.controller.inv;

import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.NonConsumableDestroyDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.NonConsumableEntryDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.NonConsumableItemDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv.NonConsumableMaintenanceDTO;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableDestroy;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableEntry;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableItem;
import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableMaintenance;
import com.pathologyLabSystem.Pathology.Lab.System.lab.service.inv.NonConsumableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/nonconsumable/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class NonConsumableController {

    private final NonConsumableService nonConService;

    // --- GET DATA ---
    @GetMapping("/items")
    public ResponseEntity<List<NonConsumableItem>> getAllItems() {
        return ResponseEntity.ok(nonConService.getAllItems());
    }

    @GetMapping("/entry")
    public ResponseEntity<List<NonConsumableEntry>> getAllEntries() {
        return ResponseEntity.ok(nonConService.getAllEntries());
    }

    @GetMapping("/destroy")
    public ResponseEntity<List<NonConsumableDestroy>> getAllDestroys() {
        return ResponseEntity.ok(nonConService.getAllDestroys());
    }

    @GetMapping("/maintenance")
    public ResponseEntity<List<NonConsumableMaintenance>> getAllMaintenanceLogs() {
        return ResponseEntity.ok(nonConService.getAllMaintenanceLogs());
    }

    // --- POST DATA ---
    @PostMapping("/items")
    public ResponseEntity<NonConsumableItem> createItem(@RequestBody NonConsumableItemDTO dto) {
        return ResponseEntity.ok(nonConService.createItem(dto));
    }

    @PostMapping("/entry")
    public ResponseEntity<NonConsumableEntry> createEntry(@RequestBody NonConsumableEntryDTO dto) {
        return ResponseEntity.ok(nonConService.processEntry(dto));
    }

    @PostMapping("/destroy")
    public ResponseEntity<NonConsumableDestroy> logDestroy(@RequestBody NonConsumableDestroyDTO dto) {
        return ResponseEntity.ok(nonConService.processDestroy(dto));
    }

    @PostMapping("/maintenance")
    public ResponseEntity<NonConsumableMaintenance> logMaintenance(@RequestBody NonConsumableMaintenanceDTO dto) {
        return ResponseEntity.ok(nonConService.processMaintenance(dto));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<NonConsumableItem> updateItem(@PathVariable Long id, @RequestBody NonConsumableItemDTO dto) {
        return ResponseEntity.ok(nonConService.updateItem(id, dto));
    }
}
