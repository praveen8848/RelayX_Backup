package com.relayx.common.config;

import com.relayx.common.security.ApiKeyAuthFilter;
import com.relayx.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ProjectRepository projectRepository;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())                          // <-- enable CORS
                .csrf(csrf -> csrf.disable())                             // stateless API, no CSRF
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Preflight requests must always pass
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                        // Everything else stays as it was
                        .requestMatchers("/api/projects/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/dashboard/**").permitAll()
                        .requestMatchers("/api/relay/**").permitAll()
                        .requestMatchers("/api/dlq/**").permitAll()
                        .requestMatchers("/api/outbox/**").permitAll()
                        .requestMatchers("/api/orders/**").permitAll()
                        .requestMatchers("/simulate/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/events").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new ApiKeyAuthFilter(projectRepository),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}