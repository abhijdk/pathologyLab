package com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Data
@Entity
@Table(name = "inv_non_con_item_destroy")
public class NonConsumableDestroy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "i_d_id") // <-- ADDED THIS
    private Long idId;

    private LocalDate date;

    @Column(name = "n_c_i_id") // <-- ADDED THIS
    private Long nciId;

    private String itemName;
    private Integer openingBalance;
    private Integer destroyQuantity;
    private Integer closingBalance;
    private String destroyedBy;
    private String remark;
}