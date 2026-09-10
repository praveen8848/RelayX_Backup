package com.relayx.project.controller;

import com.relayx.project.entity.Project;
import com.relayx.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestParam String name) {
        Project project = Project.builder().name(name).build();
        project = projectRepository.save(project);
        return ResponseEntity.ok(project);
    }

    @GetMapping
    public List<Project> listProjects() {
        return projectRepository.findAll();
    }
}