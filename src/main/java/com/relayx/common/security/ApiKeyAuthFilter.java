package com.relayx.common.security;

import com.relayx.project.entity.Project;
import com.relayx.project.repository.ProjectRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ProjectRepository projectRepository;

    public ApiKeyAuthFilter(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String apiKey = header.substring(7);
            projectRepository.findByApiKey(apiKey).ifPresent(project -> {
                // Set authentication with project ID as principal
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(project.getId(), null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
                request.setAttribute("projectId", project.getId());
            });
        }
        filterChain.doFilter(request, response);
    }
}