package com.pathologyLabSystem.Pathology.Lab.System.lab.repository.inv;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorRepository extends JpaRepository<Vendor, Long> {}

