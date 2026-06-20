//package com.pathologyLabSystem.Pathology.Lab.System.Security;
//
//
//import com.pathologyLabSystem.Pathology.Lab.System.Security.entity.User;
//import com.pathologyLabSystem.Pathology.Lab.System.Security.repo.UserRepository;
//import lombok.RequiredArgsConstructor;
//import org.apache.poi.ss.usermodel.*;
//import org.apache.poi.xssf.usermodel.XSSFWorkbook;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Service;
//
//import java.io.File;
//import java.io.FileOutputStream;
//import java.io.IOException;
//import java.time.LocalDateTime;
//import java.time.format.DateTimeFormatter;
//import java.util.List;
//
//@Service
//@RequiredArgsConstructor
//public class DatabaseBackupService {
//
//    private final UserRepository userRepository;
//
//    // Cron expression for exactly 9:45:00 AM every day
//    @Scheduled(cron = "0 45 9 * * ?")
////    @Scheduled(fixedRate = 60000) //for testing purpose
//    public void generateDailyExcelBackup() {
//        System.out.println("Starting daily Excel backup at " + LocalDateTime.now());
//
//        List<User> users = userRepository.findAll();
//
//        try (Workbook workbook = new XSSFWorkbook()) {
//            Sheet sheet = workbook.createSheet("Users Backup");
//
//            // Create the Header Row
//            Row headerRow = sheet.createRow(0);
//            String[] columns = {"ID", "Name", "Email", "Status"};
//            for (int i = 0; i < columns.length; i++) {
//                Cell cell = headerRow.createCell(i);
//                cell.setCellValue(columns[i]);
//
//                CellStyle headerStyle = workbook.createCellStyle();
//                Font font = workbook.createFont();
//                font.setBold(true);
//                headerStyle.setFont(font);
//                cell.setCellStyle(headerStyle);
//            }
//
//            // Fill data rows
//            int rowNum = 1;
//            for (User user : users) {
//                Row row = sheet.createRow(rowNum++);
//                row.createCell(0).setCellValue(user.getId().toString());
//                row.createCell(1).setCellValue(user.getName() != null ? user.getName() : "N/A");
//                row.createCell(2).setCellValue(user.getEmail());
//                row.createCell(3).setCellValue(user.isEnable() ? "Enabled" : "Disabled");
//            }
//
//            for (int i = 0; i < columns.length; i++) {
//                sheet.autoSizeColumn(i);
//            }
//
//            // Generate a unique filename
//            String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm"));
//            String fileName = "backup_users_" + dateStr + ".xlsx";
//
//            // --- FIND THE DOWNLOADS FOLDER ---
//            String userHome = System.getProperty("user.home");
//            File downloadsFolder = new File(userHome, "Downloads");
//
//            // Just in case the Downloads folder doesn't exist, create it (rare, but safe)
//            if (!downloadsFolder.exists()) {
//                downloadsFolder.mkdirs();
//            }
//
//            // Create the final file path
//            File backupFile = new File(downloadsFolder, fileName);
//
//            try (FileOutputStream fileOut = new FileOutputStream(backupFile)) {
//                workbook.write(fileOut);
//                System.out.println("Backup successfully saved to: " + backupFile.getAbsolutePath());
//            }
//
//        } catch (IOException e) {
//            System.err.println("Error creating Excel backup: " + e.getMessage());
//        }
//    }
//}