# Stage 1: Build the application using Java 26
FROM maven:3.9-eclipse-temurin-26 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application using Java 26
FROM eclipse-temurin:26-jre
WORKDIR /app
# Copy the built jar file from the build stage
COPY --from=build /app/target/*.jar app.jar
# Expose the port your Spring Boot app runs on
EXPOSE 8080
# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]