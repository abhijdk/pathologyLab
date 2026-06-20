package com.pathologyLabSystem.Pathology.Lab.System.Security.repo;


import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.Role;
import com.pathologyLabSystem.Pathology.Lab.System.Security.enums.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Role findByName(RoleEnum name);
}
