package com.pathologyLabSystem.Pathology.Lab.System.lab.repository.inv;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableDestroy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NonConsumableDestroyRepository extends JpaRepository<NonConsumableDestroy, Long> {}