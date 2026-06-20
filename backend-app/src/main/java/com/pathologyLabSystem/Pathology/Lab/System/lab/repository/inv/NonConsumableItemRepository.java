package com.pathologyLabSystem.Pathology.Lab.System.lab.repository.inv;

import com.pathologyLabSystem.Pathology.Lab.System.lab.entity.inv.NonConsumableItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NonConsumableItemRepository extends JpaRepository<NonConsumableItem, Long> {}