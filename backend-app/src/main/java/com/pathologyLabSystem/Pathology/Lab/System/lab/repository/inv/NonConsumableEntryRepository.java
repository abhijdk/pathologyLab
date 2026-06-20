package com.pathologyLabSystem.Pathology.Lab.System.lab.repository.inv;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NonConsumableEntryRepository extends JpaRepository<NonConsumableEntry, Long> {}