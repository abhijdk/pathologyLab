package com.pathologyLabSystem.Pathology.Lab.System.Security.jwt;

import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTtlSeconds;
    private final long refreshTtlSeconds;
    private final String issuer;

    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final String USER_ID_CLAIM = "userId";

    public JwtService(
            @Value("${security.jwt.secret-key:YourSuperSecretKeyThatIsAtLeast64CharactersLongForHS512AlgorithmSecurity!}") String secretString,
            @Value("${security.jwt.access-ttl-seconds:3600}") long accessTtlSeconds,
            @Value("${security.jwt.refresh-ttl-seconds:86400}") long refreshTtlSeconds,
            @Value("${security.jwt.issuer:PathologyLab}") String issuer) {

        this.key = Keys.hmacShaKeyFor(secretString.getBytes(StandardCharsets.UTF_8));
        this.accessTtlSeconds = accessTtlSeconds;
        this.refreshTtlSeconds = refreshTtlSeconds;
        this.issuer = issuer;
    }

    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, TYPE_ACCESS);
        claims.put(USER_ID_CLAIM, user.getId());
        return buildToken(claims, user.getUsername(), accessTtlSeconds, null);
    }

    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(TOKEN_TYPE_CLAIM, TYPE_REFRESH);
        claims.put(USER_ID_CLAIM, user.getId());
        return buildToken(claims, user.getUsername(), refreshTtlSeconds, UUID.randomUUID().toString());
    }

    private String buildToken(Map<String, Object> extraClaims, String username, long ttlSeconds, String jti) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + (ttlSeconds * 1000));

        var builder = Jwts.builder()
                .claims(extraClaims)
                .subject(username)
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(key);

        if (jti != null && !jti.trim().isEmpty()) {
            builder.id(jti);
        }

        return builder.compact();
    }

    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload(); // Corrected for JJWT 0.12+
        } catch (JwtException e) {
            throw e;
        }
    }
}