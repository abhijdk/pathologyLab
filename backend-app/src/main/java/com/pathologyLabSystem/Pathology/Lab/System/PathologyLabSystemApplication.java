package com.pathologyLabSystem.Pathology.Lab.System;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PathologyLabSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(PathologyLabSystemApplication.class, args);
	}

}
