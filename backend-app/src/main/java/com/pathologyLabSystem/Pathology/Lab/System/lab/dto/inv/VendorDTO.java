package com.pathologyLabSystem.Pathology.Lab.System.lab.dto.inv;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VendorDTO {
    private String vendorName;
    private String vendorMobile;
    private String vendorEmail;

    // Add this to catch the opening balance from React
    private BigDecimal balance;
}