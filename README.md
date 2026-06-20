# 🧪 Pathology Lab Management Database

## 📌 Overview

This project contains the database schema for a **Pathology Lab Management System**. It is designed to manage patients, doctors, test bookings, categories, parameters, and reports efficiently.

---

## 🗂️ Database Name

`pathologylab`

---

## 📊 Tables Structure

### 1. 🧾 booking_test

Stores test booking details.

* `booking_id` (PK)
* `patient_id` (FK → patient)
* `doctor_id` (FK → doctor)
* `booking_category` (JSON)
* `booking_date`
* `total_amount`
* `advance_amount`
* `remaining_amount`
* `payment_status` (Pending / Partial / Paid / Refunded)
* `report_status` (Awaiting / In Progress / Generated / Delivered)

---

### 2. 👨‍⚕️ doctor

Stores doctor details and commission info.

* `doctor_id` (PK)
* `name`
* `commission_percentage`
* `total_commission`
* `received_commission`

---

### 3. 🧑 patient

Stores patient information.

* `patient_id` (PK)
* `name`
* `age`
* `gender`
* `phone`
* `created_date`

---

### 4. 🧪 test_master

Defines available tests.

* `test_id` (PK)
* `test_name`
* `description`
* `is_active`
* `display_order`

---

### 5. 📁 test_category

Groups test parameters under categories.

* `category_id` (PK)
* `test_id` (FK → test_master)
* `category_name`
* `display_order`
* `is_active`
* `amount`

---

### 6. 📌 test_parameter

Stores individual test parameters.

* `param_id` (PK)
* `category_id` (FK → test_category)
* `param_name`
* `unit`
* `ref_male_min`
* `ref_male_max`
* `ref_female_min`
* `ref_female_max`
* `display_order`
* `is_active`

---

### 7. 📄 test_report

Stores patient test results.

* `report_id` (PK)
* `booking_id` (FK → booking_test)
* `category_id` (FK → test_category)
* `param_id`
* `result_value`
* `captured_at`

---

## 🔗 Relationships

* A **patient** can have multiple **bookings**
* A **doctor** can be associated with multiple **bookings**
* A **test** has multiple **categories**
* A **category** has multiple **parameters**
* A **booking** generates multiple **reports**






--Describe Table Format--


mysql> show tables;
+------------------------+
| Tables_in_pathologylab |
+------------------------+
| booking_test           |
| doctor                 |
| patient                |
| test_category          |
| test_master            |
| test_parameter         |
| test_report            |
+------------------------+
7 rows in set (0.05 sec)



mysql> desc booking_test;
+------------------+--------------------------------------------------------+------+-----+-------------------+-------------------+
| Field            | Type                                                   | Null | Key | Default           | Extra             |
+------------------+--------------------------------------------------------+------+-----+-------------------+-------------------+
| booking_id       | bigint                                                 | NO   | PRI | NULL              | auto_increment    |
| patient_id       | bigint                                                 | NO   | MUL | NULL              |                   |
| doctor_id        | int                                                    | NO   | MUL | NULL              |                   |
| booking_category | json                                                   | NO   |     | NULL              |                   |
| booking_date     | datetime                                               | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| total_amount     | decimal(10,2)                                          | NO   |     | NULL              |                   |
| advance_amount   | decimal(10,2)                                          | YES  |     | 0.00              |                   |
| remaining_amount | decimal(38,2)                                          | YES  |     | NULL              |                   |
| payment_status   | enum('Pending','Partial','Paid','Refunded')            | YES  |     | Pending           |                   |
| report_status    | enum('Awaiting','In Progress','Generated','Delivered') | YES  |     | Awaiting          |                   |
+------------------+--------------------------------------------------------+------+-----+-------------------+-------------------+
10 rows in set (0.06 sec)

mysql> desc doctor;
+-----------------------+---------------+------+-----+---------+----------------+
| Field                 | Type          | Null | Key | Default | Extra          |
+-----------------------+---------------+------+-----+---------+----------------+
| doctor_id             | int           | NO   | PRI | NULL    | auto_increment |
| name                  | varchar(255)  | YES  |     | NULL    |                |
| commission_percentage | decimal(38,2) | YES  |     | NULL    |                |
| total_commission      | decimal(38,2) | YES  |     | NULL    |                |
| received_commission   | decimal(38,2) | YES  |     | NULL    |                |
+-----------------------+---------------+------+-----+---------+----------------+
5 rows in set (0.01 sec)

mysql> desc patient;
+--------------+--------------+------+-----+-------------------+-------------------+
| Field        | Type         | Null | Key | Default           | Extra             |
+--------------+--------------+------+-----+-------------------+-------------------+
| patient_id   | bigint       | NO   | PRI | NULL              | auto_increment    |
| name         | varchar(255) | YES  |     | NULL              |                   |
| age          | int          | YES  |     | NULL              |                   |
| gender       | varchar(255) | YES  |     | NULL              |                   |
| phone        | varchar(255) | YES  |     | NULL              |                   |
| created_date | timestamp    | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+--------------+------+-----+-------------------+-------------------+
6 rows in set (0.00 sec)

mysql> desc test_category;
+---------------+--------------+------+-----+---------+----------------+
| Field         | Type         | Null | Key | Default | Extra          |
+---------------+--------------+------+-----+---------+----------------+
| category_id   | bigint       | NO   | PRI | NULL    | auto_increment |
| test_id       | bigint       | NO   | MUL | NULL    |                |
| category_name | varchar(255) | YES  |     | NULL    |                |
| display_order | int          | YES  |     | NULL    |                |
| is_active     | bit(1)       | YES  |     | NULL    |                |
| amount        | double       | YES  |     | NULL    |                |
+---------------+--------------+------+-----+---------+----------------+
6 rows in set (0.00 sec)

mysql> desc test_master;
+---------------+--------------+------+-----+---------+----------------+
| Field         | Type         | Null | Key | Default | Extra          |
+---------------+--------------+------+-----+---------+----------------+
| test_id       | bigint       | NO   | PRI | NULL    | auto_increment |
| test_name     | varchar(255) | YES  |     | NULL    |                |
| description   | varchar(255) | YES  |     | NULL    |                |
| is_active     | int          | YES  |     | NULL    |                |
| display_order | int          | YES  |     | NULL    |                |
+---------------+--------------+------+-----+---------+----------------+
5 rows in set (0.00 sec)


indsert test master 

INSERT INTO test_master (test_name, description, display_order) VALUES
	('Blood Test', 'All blood related blood investigations', 1),
	('Urine Test', 'Urine examination', 2),
	('Stool Test', 'Stool examination', 3),
	('Semen Test', 'Semen analysis', 4) ;

mysql> desc test_parameter;
+----------------+--------------+------+-----+---------+----------------+
| Field          | Type         | Null | Key | Default | Extra          |
+----------------+--------------+------+-----+---------+----------------+
| param_id       | bigint       | NO   | PRI | NULL    | auto_increment |
| category_id    | bigint       | NO   | MUL | NULL    |                |
| param_name     | varchar(255) | YES  |     | NULL    |                |
| unit           | varchar(255) | YES  |     | NULL    |                |
| ref_male_min   | varchar(255) | YES  |     | NULL    |                |
| ref_male_max   | varchar(255) | YES  |     | NULL    |                |
| ref_female_min | varchar(255) | YES  |     | NULL    |                |
| ref_female_max | varchar(255) | YES  |     | NULL    |                |
| display_order  | int          | YES  |     | NULL    |                |
| is_active      | bit(1)       | YES  |     | NULL    |                |
+----------------+--------------+------+-----+---------+----------------+
10 rows in set (0.00 sec)

mysql> desc test_report;
+--------------+--------------+------+-----+-------------------+-------------------+
| Field        | Type         | Null | Key | Default           | Extra             |
+--------------+--------------+------+-----+-------------------+-------------------+
| report_id    | bigint       | NO   | PRI | NULL              | auto_increment    |
| booking_id   | bigint       | NO   | MUL | NULL              |                   |
| category_id  | bigint       | NO   | MUL | NULL              |                   |
| param_id     | bigint       | NO   |     | NULL              |                   |
| result_value | varchar(255) | YES  |     | NULL              |                   |
| captured_at  | datetime     | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+--------------+--------------+------+-----+-------------------+-------------------+
6 rows in set (0.00 sec)

mysql>
