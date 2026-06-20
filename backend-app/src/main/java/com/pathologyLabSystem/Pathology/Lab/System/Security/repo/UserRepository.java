package com.pathologyLabSystem.Pathology.Lab.System.Security.repo;



import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

}