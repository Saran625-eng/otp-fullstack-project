
package com.hexgen.otpauth.player.repository;

import com.hexgen.otpauth.player.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {

    boolean existsByEmail(String email);

    boolean existsByMobileNumber(String mobileNumber);
}
