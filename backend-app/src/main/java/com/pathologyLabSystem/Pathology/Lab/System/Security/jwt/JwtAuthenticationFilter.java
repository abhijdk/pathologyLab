package com.pathologyLabSystem.Pathology.Lab.System.Security.jwt;

import com.pathologyLabSystem.Pathology.Lab.System.Security.repo.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                Claims payload = jwtService.parseToken(token);

                if (!"access".equals(payload.get("token_type", String.class))) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Invalid token type. Please provide a valid Access Token.\"}");
                    return;
                }

                String userIdStr = payload.get("userId", String.class);

                if (userIdStr != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    userRepository.findById(UUID.fromString(userIdStr)).ifPresent(user -> {

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                user, null, user.getAuthorities() // Using getAuthorities directly from User entity
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                    });
                }
            } catch (JwtException | IllegalArgumentException e) {
                logger.warn("JWT parsing error: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
//    souldnotfilter api/vi/auth


    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();

        // ONLY skip the login endpoint.
        // The register endpoint MUST be filtered so it can read the ADMIN token!
        return path.equals("/api/v1/auth/login");
    }
//
}