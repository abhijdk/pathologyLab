package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inv_item_master")
public class ItemMaster {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;
    private String itemName;
    private Integer stock;
    private String suffix;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
