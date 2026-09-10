package com.relayx.common.config;

import com.relayx.common.security.ApiKeyAuthFilter;
import com.relayx.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
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
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/events/**").authenticated()  // protected
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new ApiKeyAuthFilter(projectRepository), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}