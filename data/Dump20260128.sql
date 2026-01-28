-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: inventory_ins
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approval`
--

DROP TABLE IF EXISTS `approval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tools_id` int DEFAULT NULL,
  `spares_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `action_by` int DEFAULT NULL,
  `field_name` varchar(255) NOT NULL,
  `old_value` text NOT NULL,
  `new_value` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `action_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tools_id` (`tools_id`),
  KEY `spares_id` (`spares_id`),
  KEY `created_by` (`created_by`),
  KEY `action_by` (`action_by`),
  CONSTRAINT `approval_ibfk_1` FOREIGN KEY (`tools_id`) REFERENCES `tools` (`id`) ON DELETE SET NULL,
  CONSTRAINT `approval_ibfk_2` FOREIGN KEY (`spares_id`) REFERENCES `spares` (`id`) ON DELETE SET NULL,
  CONSTRAINT `approval_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `approval_ibfk_4` FOREIGN KEY (`action_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval`
--

LOCK TABLES `approval` WRITE;
/*!40000 ALTER TABLE `approval` DISABLE KEYS */;
INSERT INTO `approval` VALUES (1,NULL,2,2,1,'obs_authorised','22','27','rejected','2026-01-15 17:59:40','2026-01-16 11:52:09'),(2,NULL,5,2,2,'obs_authorised','9','10','rejected','2026-01-15 18:05:31','2026-01-15 22:45:59'),(3,NULL,2,2,1,'obs_authorised','27','10','rejected','2026-01-15 22:50:58','2026-01-15 23:05:32'),(5,NULL,2,2,1,'obs_authorised','27','25','approved','2026-01-16 07:53:54','2026-01-16 08:34:08'),(6,NULL,6,2,1,'obs_authorised','9','12','rejected','2026-01-16 08:27:49','2026-01-16 08:33:36'),(7,NULL,6,2,1,'obs_authorised','9','10','approved','2026-01-16 08:34:37','2026-01-16 11:49:27'),(9,NULL,8,2,1,'obs_authorised','9','10','approved','2026-01-16 11:51:08','2026-01-16 11:56:02'),(11,NULL,NULL,2,1,'obs_authorised','18','20','approved','2026-01-16 12:11:16','2026-01-17 11:57:29'),(12,NULL,4,2,1,'obs_authorised','15','20','rejected','2026-01-16 12:11:32','2026-01-17 11:57:26'),(13,1,NULL,2,1,'obs_authorised','28','30','approved','2026-01-16 15:08:18','2026-01-19 11:30:20'),(14,NULL,2,2,1,'obs_authorised','25','30','approved','2026-01-17 11:55:00','2026-01-17 22:09:42'),(15,NULL,2,2,1,'obs_authorised','30','35','approved','2026-01-17 22:10:19','2026-01-18 06:29:58'),(16,NULL,2,2,1,'obs_authorised','35','40','approved','2026-01-18 06:31:17','2026-01-19 11:15:25'),(17,2,NULL,2,1,'obs_authorised','30','40','approved','2026-01-18 07:35:19','2026-01-19 11:15:11'),(18,1,NULL,2,NULL,'obs_authorised','30','35','pending','2026-01-19 11:31:30',NULL),(19,2,NULL,2,NULL,'obs_authorised','40','45','pending','2026-01-19 11:48:29',NULL),(20,NULL,2,2,1,'obs_authorised','40','45','approved','2026-01-19 11:56:42','2026-01-21 08:07:31'),(21,NULL,2,2,NULL,'obs_authorised','45','55','pending','2026-01-21 08:39:16',NULL),(22,NULL,4,2,NULL,'obs_authorised','15','25','pending','2026-01-21 22:53:56',NULL),(23,NULL,NULL,2,NULL,'obs_authorised','20','5','pending','2026-01-22 10:55:57',NULL);
/*!40000 ALTER TABLE `approval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `attr_1` varchar(50) NOT NULL,
  `attr_2` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
INSERT INTO `config` VALUES (1,'location_of_storage','FWD SPTA',NULL),(3,'location_of_storage','AER Workshop',NULL),(4,'location_of_storage','Reserved Room1',NULL),(5,'location_of_storage','RACK-A',NULL),(6,'location_of_storage','RACK-B',NULL),(7,'location_of_storage','RACK-C',NULL),(9,'issue','FER',NULL),(10,'issue','AER',NULL),(11,'issue','OMS',NULL),(12,'issue','Control',NULL),(16,'concurred_by','EO',NULL),(17,'concurred_by','SEO',NULL),(18,'concurred_by','AEO (FWD)',NULL),(19,'concurred_by','AEO (AFT)',NULL),(20,'concurred_by','AEO (OMS)',NULL),(27,'service_no','001','Amit  Sharma'),(28,'service_no','002','Rohit Verma'),(29,'service_no','003','Anjali Singh'),(30,'service_no','004','Arjun Mehta'),(31,'service_no','005','Priya Nair'),(32,'service_no','006','Kunal Bose'),(33,'service_no','000','Sudipto Dutta'),(34,'service_no','10010','Sudipto Dutta'),(45,'concurred_by','new',NULL),(46,'concurred_by','new 2',NULL);
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Engineering'),(2,'Support');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_transaction`
--

DROP TABLE IF EXISTS `loan_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int DEFAULT NULL,
  `date` varchar(15) DEFAULT NULL,
  `box_no` text,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `loan_transaction_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `pending` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_transaction`
--

LOCK TABLES `loan_transaction` WRITE;
/*!40000 ALTER TABLE `loan_transaction` DISABLE KEYS */;
INSERT INTO `loan_transaction` VALUES (10,18,'20251027',NULL,3),(11,18,'20251027',NULL,2),(12,18,'20251027',NULL,1),(13,18,'20251027',NULL,1);
/*!40000 ALTER TABLE `loan_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lp`
--

DROP TABLE IF EXISTS `lp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `equipment_system` varchar(255) DEFAULT NULL,
  `denos` varchar(255) DEFAULT NULL,
  `obs_authorised` varchar(255) DEFAULT NULL,
  `obs_held` varchar(255) DEFAULT NULL,
  `box_no` varchar(255) DEFAULT NULL,
  `storage_location` varchar(255) DEFAULT NULL,
  `remarks` text,
  `department` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `department` (`department`),
  CONSTRAINT `lp_ibfk_1` FOREIGN KEY (`department`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lp`
--

LOCK TABLES `lp` WRITE;
/*!40000 ALTER TABLE `lp` DISABLE KEYS */;
INSERT INTO `lp` VALUES (1,'Coloured Marking Tape','General','Nos',NULL,'3','2','Aft SPTA',NULL,1);
/*!40000 ALTER TABLE `lp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oem`
--

DROP TABLE IF EXISTS `oem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` text,
  `contacts` json DEFAULT NULL,
  `details` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oem`
--

LOCK TABLES `oem` WRITE;
/*!40000 ALTER TABLE `oem` DISABLE KEYS */;
INSERT INTO `oem` VALUES (1,'dthfth','203, Bangur Ave\nBangur Avenue, Block A, Lake Town','[\"cm\"]','[{\"name\": \"SUDIPTO DUTTA\", \"phone\": \"7449550732\", \"prefix\": \"Mr\", \"designation\": \"\"}, {\"name\": \"\", \"phone\": \"\", \"prefix\": \"Mr\", \"designation\": \"\"}]'),(2,'xyz','203, Bangur AveBangur Avenue, Block A, Lake Town','\"456774634553\"',NULL),(3,'xyz223','203, Bangur AveBangur Avenue, Block A, Lake Town, bdsherjha','\"456774634553\"',NULL),(8,'oem 2026','dsfs','[\"dvre\"]','[{\"name\": \"fdvfrv\", \"phone\": \"dvre\", \"prefix\": \"Mr\", \"designation\": \"dsvds\"}]'),(9,'gfng222','gfg','[\"ngfn\"]','[{\"name\": \"gngf\", \"phone\": \"gngf\", \"prefix\": \"Mr\", \"designation\": \"gngf\"}]'),(10,'bgfbgfb','bbngf','[\"bfdbfd\"]','[{\"name\": \"fdbf\", \"phone\": \"fbfd\", \"prefix\": \"Mr\", \"designation\": \"fdbfdb\"}]');
/*!40000 ALTER TABLE `oem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending`
--

DROP TABLE IF EXISTS `pending`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(15) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `department` int DEFAULT NULL,
  `demand_type` varchar(63) DEFAULT NULL,
  `issued_to` varchar(63) DEFAULT NULL,
  `issue_date` varchar(63) DEFAULT NULL,
  `servay_no` varchar(63) DEFAULT NULL,
  `voucher_no` varchar(63) DEFAULT NULL,
  `demand_no` varchar(63) DEFAULT NULL,
  `nac_no` varchar(63) DEFAULT NULL,
  `nac_date` varchar(63) DEFAULT NULL,
  `survey_date` varchar(63) DEFAULT NULL,
  `issue_category` varchar(32) DEFAULT NULL,
  `issue_box_no` text,
  `status` varchar(15) DEFAULT 'pending',
  `unit_name` varchar(64) DEFAULT NULL,
  `person_name` varchar(64) DEFAULT NULL,
  `service_name` varchar(64) DEFAULT NULL,
  `phone_no` varchar(14) DEFAULT NULL,
  `loan_duration` int DEFAULT NULL,
  `conquered_by` varchar(64) DEFAULT NULL,
  `box_details` varchar(64) DEFAULT NULL,
  `loan_status` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `department` (`department`),
  CONSTRAINT `pending_ibfk_1` FOREIGN KEY (`department`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending`
--

LOCK TABLES `pending` WRITE;
/*!40000 ALTER TABLE `pending` DISABLE KEYS */;
INSERT INTO `pending` VALUES (17,'1761367336982',4,1,NULL,'aer','20251027',NULL,NULL,NULL,NULL,NULL,NULL,'temporary','[{\"no\":\"009\",\"qn\":\"4\"}]','issued',NULL,NULL,NULL,NULL,10,NULL,NULL,'complete'),(18,'1761368066432',7,1,NULL,NULL,'20251027',NULL,NULL,NULL,NULL,NULL,NULL,'loan','[{\"no\":\"021\",\"qn\":0},{\"no\":\"022\",\"qn\":\"7\"}]','issued','One','Two','Three','9876543210',20,'Four',NULL,'complete'),(19,'1761367371154',5,1,NULL,'oms','20251026',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":0},{\"no\":\"008\",\"qn\":\"5\"}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(20,'1761367336982',2,1,NULL,'aer','20251027',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":\"2\"}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(28,'1761367371154',6,1,NULL,'aer','20251027',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":\"6\"},{\"no\":\"008\",\"qn\":0}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(48,'1761367336982',1,1,NULL,'fer','20260109',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"0010\",\"qn\":1}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending'),(49,'1761368066432',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,'1761367371154',6,1,NULL,'oms','20251028',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":\"4\"},{\"no\":\"008\",\"qn\":\"2\"}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(51,'1761367336982',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(52,'1761368066432',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(53,'1761367371154',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `pending` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permanent_transaction`
--

DROP TABLE IF EXISTS `permanent_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permanent_transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` int DEFAULT NULL,
  `date` varchar(15) DEFAULT NULL,
  `servay_number` varchar(45) DEFAULT NULL,
  `voucher_no` varchar(45) DEFAULT NULL,
  `pending_id` int DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `demand_no` varchar(45) DEFAULT NULL,
  `demand_date` varchar(15) DEFAULT NULL,
  `nac_no` varchar(45) DEFAULT NULL,
  `nac_date` varchar(15) DEFAULT NULL,
  `rate` varchar(10) DEFAULT NULL,
  `validity` varchar(10) DEFAULT NULL,
  `mo_no` varchar(45) DEFAULT NULL,
  `gate_pass_date` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pending_id` (`pending_id`),
  CONSTRAINT `permanent_transaction_ibfk_1` FOREIGN KEY (`pending_id`) REFERENCES `pending` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permanent_transaction`
--

LOCK TABLES `permanent_transaction` WRITE;
/*!40000 ALTER TABLE `permanent_transaction` DISABLE KEYS */;
INSERT INTO `permanent_transaction` VALUES (2,2,'20251026','456793','567890',19,'inventory','345345','20251027','123456','20251027','100','20',NULL,NULL),(3,3,'20251027','456312','678456',19,'inventory','5678567','20251027',NULL,NULL,NULL,NULL,'345345','20251027'),(4,1,'20251027','1234','456456',20,'inventory','45645','20251027',NULL,NULL,NULL,NULL,'4536456','20251027'),(5,1,'20251027','45645','678678',20,'inventory','2345345','20251027',NULL,NULL,NULL,NULL,'456456','20251027'),(15,3,'20251028',NULL,'456456',50,'inventory','456456','20251028','567234','20251028','100','120',NULL,NULL),(16,2,'20251028',NULL,'4564532',50,'demanded','65465','20251223',NULL,NULL,NULL,NULL,NULL,NULL),(17,1,'20251028',NULL,'768342',50,'surveyed',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `permanent_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spares`
--

DROP TABLE IF EXISTS `spares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(64) DEFAULT NULL,
  `equipment_system` varchar(255) DEFAULT NULL,
  `denos` varchar(255) DEFAULT NULL,
  `critical_spare` tinyint(1) NOT NULL DEFAULT '0',
  `obs_authorised` varchar(255) DEFAULT NULL,
  `obs_authorised_new` int DEFAULT NULL,
  `obs_held` varchar(255) DEFAULT NULL,
  `b_d_authorised` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `box_no` text,
  `item_distribution` varchar(255) DEFAULT NULL,
  `storage_location` varchar(255) DEFAULT NULL,
  `item_code` varchar(255) DEFAULT NULL,
  `indian_pattern` varchar(255) DEFAULT NULL,
  `remarks` text,
  `department` int DEFAULT NULL,
  `image` varchar(32) DEFAULT NULL,
  `nac_date` varchar(63) DEFAULT NULL,
  `uid` varchar(15) DEFAULT NULL,
  `oem` varchar(254) DEFAULT NULL,
  `substitute_name` varchar(127) DEFAULT NULL,
  `local_terminology` varchar(127) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `department` (`department`),
  CONSTRAINT `spares_ibfk_1` FOREIGN KEY (`department`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spares`
--

LOCK TABLES `spares` WRITE;
/*!40000 ALTER TABLE `spares` DISABLE KEYS */;
INSERT INTO `spares` VALUES (2,'Telephone 123','CGT','Nos',0,'45',NULL,'40','0','P','[{\"no\":\"Rabc01\",\"qn\":\"20\",\"qtyHeld\":\"7\",\"location\":\"new location 2026\"},{\"no\":\"R0123\",\"qn\":\"25\",\"qtyHeld\":\"3\",\"location\":\"RACK-C\"}]',NULL,'FWD SPTA 2026','090088009-07','IN-TELE-STD-001','Operational',1,'image_1760940071913.jpg','20251020','1761367371154','BEL India','Naval Telephone Mk-II','Internal Communication Set'),(3,'TORQUE WRENCH','CGT','NOS',0,'9',NULL,'9','  BBFBV','C','[{\"boxNumber\":\"\",\"quantity\":\"\",\"qn\":\"9\",\"qtyHeld\":\"9\",\"no\":\"R001\",\"location\":\"Reserved Room1\"}]',NULL,'FWD SPTA','090088009-07','HJLJLBBBBBNNMMLL',NULL,1,'null',NULL,'1768036090227',NULL,NULL,NULL),(4,'TORQUE WRENCH','CGT','NOS',1,'15',NULL,'7',NULL,'P','[{\"boxNumber\":\"\",\"quantity\":\"\",\"qn\":\"10\",\"no\":\"001\",\"qtyHeld\":\"0\",\"location\":\"AER WORKSHOP\"},{\"no\":\"002\",\"qn\":\"5\",\"qtyHeld\":\"7\",\"location\":\"  FWD SPTA\"},{\"no\":\"003\",\"qn\":\"10\",\"qtyHeld\":\"0\",\"location\":\"acas\"}]',NULL,'NEW LOCATION',NULL,'EM-867-67564MJOK',NULL,1,'null',NULL,'1768036114352',NULL,NULL,NULL),(5,'TORQUE WRENCH','CGT','NOS',0,'9',NULL,'5','2','P','[{\"boxNumber\":\"\",\"quantity\":\"\",\"qn\":\"9\",\"no\":\"001\",\"qtyHeld\":\"5\",\"location\":\"Reserved Room1\"},{\"no\":\"002\",\"qn\":\"0\",\"qtyHeld\":\"0\",\"location\":\"RACK-A\"}]',NULL,'AER WORKSHOP',NULL,' F FDFDBFBGFB',NULL,1,'null',NULL,'1768036160556',NULL,NULL,NULL),(6,'TORQUE WRENCH','CGT','NOS',1,'10',NULL,'1',NULL,NULL,'[{\"boxNumber\":\"\",\"quantity\":\"\",\"no\":\"001\",\"qn\":\"5\",\"qtyHeld\":\"1\",\"location\":\"NEW LOCATION\"},{\"no\":\"002\",\"qn\":\"5\",\"qtyHeld\":\"0\",\"location\":\"LOCATION 1\"}]',NULL,NULL,NULL,NULL,NULL,1,'null',NULL,'1768037647686',NULL,NULL,NULL),(7,'TORQUE WRENCH','CGT','NOS',0,'6',NULL,'OOO',NULL,NULL,'[{\"boxNumber\":\"\",\"quantity\":\"\",\"no\":\"001\",\"qn\":\"9\",\"qtyHeld\":\"\"}]',NULL,NULL,NULL,NULL,NULL,1,'null',NULL,'1768037672776',NULL,NULL,NULL),(8,'TORQUE WRENCH','CGT','NOS',0,'10',NULL,'10',NULL,NULL,'[{\"boxNumber\":\"\",\"quantity\":\"\",\"no\":\"001\",\"qn\":\"5\",\"qtyHeld\":\"0\",\"location\":\"RACK-A\"},{\"no\":\"002\",\"qn\":\"2\",\"qtyHeld\":\"10\",\"location\":\"RACK-B\"},{\"no\":\"003\",\"qn\":\"3\",\"qtyHeld\":\"0\",\"location\":\"RACK-C\"}]',NULL,NULL,NULL,NULL,NULL,1,'null',NULL,'1768037763927',NULL,NULL,NULL),(9,'TORQUE WRENCH','CGT','NOS',0,'9',NULL,'5',NULL,NULL,'[{\"no\":\"001\",\"qn\":\"5\",\"qtyHeld\":\"3\",\"location\":\"FWD SPTA\"},{\"no\":\"002\",\"qn\":\"4\",\"qtyHeld\":\"2\",\"location\":\"RACK-A\"}]',NULL,NULL,NULL,NULL,NULL,1,'null',NULL,'1768038130343',NULL,NULL,NULL),(10,'TORQUE WRENCH','CGT','NOS',0,'9',NULL,'7',NULL,NULL,'[{\"no\":\"R001\",\"qn\":\"9\",\"qtyHeld\":\"7\",\"location\":\"RACK-A\"}]',NULL,NULL,NULL,NULL,NULL,1,'null',NULL,'1768040311559',NULL,NULL,NULL),(11,'TORQUE WRENCH','CGT','NOS',0,'9',NULL,'7',NULL,NULL,'[{\"no\":\"Abvg\",\"qn\":\"10\",\"qtyHeld\":\"\",\"location\":\"\"}]',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'1768191133731',NULL,NULL,NULL),(12,'TORQUE WRENCH','CGT','NOS',0,'9',NULL,'1',NULL,NULL,'[{\"boxNumber\":\"\",\"quantity\":\"\",\"qn\":\"9\",\"qtyHeld\":\"1\",\"no\":\"001\",\"location\":\"NGFNGF\"}]',NULL,NULL,NULL,NULL,NULL,1,'null',NULL,'1768191226599',NULL,NULL,NULL),(13,'TORQUE WRENCH','CGT','NOS',0,'10',NULL,'1',NULL,NULL,'[{\"no\":\"\",\"qn\":\"10\",\"qtyHeld\":\"\",\"location\":\"\"}]',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'1768219172565',NULL,NULL,NULL),(14,'TORQUE WRENCH','CGT','NOS',0,'10',NULL,'1',NULL,NULL,'[{\"no\":\"\",\"qn\":\"10\",\"qtyHeld\":\"\",\"location\":\"\"}]',NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,'1768227364420',NULL,NULL,NULL);
/*!40000 ALTER TABLE `spares` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `special_demand`
--

DROP TABLE IF EXISTS `special_demand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_demand` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spare_id` int DEFAULT NULL,
  `tool_id` int DEFAULT NULL,
  `obs_authorised` int NOT NULL,
  `obs_increase_qty` int NOT NULL,
  `internal_demand_no` varchar(50) DEFAULT NULL,
  `internal_demand_date` date DEFAULT NULL,
  `requisition_no` varchar(50) DEFAULT NULL,
  `requisition_date` date DEFAULT NULL,
  `mo_demand_no` varchar(50) DEFAULT NULL,
  `mo_demand_date` date DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_by_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_approved_by` (`approved_by`),
  CONSTRAINT `fk_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `special_demand`
--

LOCK TABLES `special_demand` WRITE;
/*!40000 ALTER TABLE `special_demand` DISABLE KEYS */;
INSERT INTO `special_demand` VALUES (1,12,NULL,1,25,'INT-DMD-2025-001','2025-01-24','REQ-7789','2025-01-23','MO-4567','2025-01-22',101,'Sudipto Dutta','2026-01-24 13:14:16',NULL,NULL),(2,12,NULL,1,25,'INT-DMD-2025-001','2025-01-24','REQ-7789','2025-01-23','MO-4567','2025-01-22',2,'Avijit Paul','2026-01-24 17:29:27',NULL,NULL),(8,NULL,NULL,1,25,'INT-DMD-2025-001','2025-01-24','REQ-7789','2025-01-23',NULL,NULL,2,'Avijit Paul','2026-01-25 02:33:09',NULL,NULL),(9,2,NULL,25,10,'bfn333','2026-01-26','fnd33333','2026-01-26','ghj33333','2026-01-27',2,'Avijit Paul','2026-01-25 02:38:08',NULL,NULL),(11,2,NULL,62,5,'fngf','2026-01-26','gfgtf','2026-01-26','bfbf','2026-01-26',2,'Avijit Paul','2026-01-26 03:17:24',NULL,NULL),(12,2,NULL,20,5,'gmgfm','2026-01-26','fdngf','2026-01-26','hgmh','2026-01-26',2,'Avijit Paul','2026-01-26 03:25:00',NULL,NULL),(13,2,NULL,20,4,'bfb3333333','2026-01-26','fbvfdb3333333333','2026-01-26','vdsv3333333333','2026-01-26',2,'Avijit Paul','2026-01-26 03:48:46',NULL,NULL),(14,2,NULL,46,1,'xvc','2026-01-28','fghhfg','2026-01-09','bnmbnm','2026-01-29',2,'Avijit Paul','2026-01-26 03:58:55',NULL,NULL),(15,2,NULL,50,5,'sdvsdv22','2026-01-26','dfdsv22','2026-01-26','dvfdv','2026-01-26',2,'Avijit Paul','2026-01-26 11:15:07',NULL,NULL),(16,2,NULL,70,25,'ffdfd','2026-01-26','gfgtf','2026-01-26','fdfdgd','2026-01-26',2,'Avijit Paul','2026-01-26 11:22:23',NULL,NULL),(17,2,NULL,75,30,'fbfd33339999999999','2026-01-26','bfdf333399999999','2026-01-14','bfdbfd8886','2026-01-26',2,'Avijit Paul','2026-01-26 11:38:44',NULL,NULL),(18,2,NULL,55,10,'gngfn','2026-01-26','fbfd','2026-01-13','dbf','2026-01-26',2,'Avijit Paul','2026-01-26 16:28:09',NULL,NULL),(19,2,NULL,50,5,'chjjhjhj','2026-01-14','hvkvhkvhk','2026-01-14',NULL,NULL,2,'Avijit Paul','2026-01-26 17:01:52',NULL,NULL),(20,2,NULL,60,10,'ggf','2026-01-06','bcbf','2026-01-06','gnn','2026-01-26',2,'Avijit Paul','2026-01-26 17:02:28',NULL,NULL);
/*!40000 ALTER TABLE `special_demand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` text,
  `contacts` json DEFAULT NULL,
  `details` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES (2,'fbfdb','P-203, BLOCK-A, BANGUR AVENUE','[\"brrfb\"]','[{\"name\": \"SUDIPTO DUTTA\", \"phone\": \"07449550732\", \"prefix\": \"Mr\", \"designation\": \"bfbfdb\"}]'),(3,'SUDIPTO DUTTA','P-203, BLOCK-A, BANGUR AVENUE','\"978999996\"',NULL),(4,'ngn','cbx','[\"bxfdb\"]','[{\"name\": \"dbds\", \"phone\": \"dbdb\", \"prefix\": \"Mr\", \"designation\": \"dbfdb\"}]'),(9,'supplier 2026','dfe','[\"dvfd\"]','[{\"name\": \"vdv\", \"phone\": \"dssd\", \"prefix\": \"Mr\", \"designation\": \"dsvd\"}]'),(10,'bfdb','fbf','[\"fbgf\"]','[{\"name\": \"fdbfdb\", \"phone\": \"bfb\", \"prefix\": \"Mr\", \"designation\": \"fdbf\"}]');
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temp_loan_transaction`
--

DROP TABLE IF EXISTS `temp_loan_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temp_loan_transaction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int DEFAULT NULL,
  `date` varchar(15) DEFAULT NULL,
  `box_no` text,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `temp_loan_transaction_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `pending` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temp_loan_transaction`
--

LOCK TABLES `temp_loan_transaction` WRITE;
/*!40000 ALTER TABLE `temp_loan_transaction` DISABLE KEYS */;
INSERT INTO `temp_loan_transaction` VALUES (1,NULL,'20251026',NULL,2),(7,17,'20251027',NULL,1),(8,17,'20251027',NULL,2),(9,17,'20251027',NULL,1);
/*!40000 ALTER TABLE `temp_loan_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temporary_issue_local`
--

DROP TABLE IF EXISTS `temporary_issue_local`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temporary_issue_local` (
  `id` int NOT NULL AUTO_INCREMENT,
  `spare_id` int DEFAULT NULL,
  `tool_id` int DEFAULT NULL,
  `qty_withdrawn` int NOT NULL,
  `service_no` varchar(100) NOT NULL,
  `issue_to` varchar(150) NOT NULL,
  `issue_date` date NOT NULL,
  `loan_duration` int DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `box_no` json DEFAULT NULL,
  `qty_received` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_temp_issue_spare` (`spare_id`),
  KEY `fk_temp_issue_tool` (`tool_id`),
  KEY `fk_temp_issue_created_by` (`created_by`),
  KEY `fk_temp_issue_approved_by` (`approved_by`),
  CONSTRAINT `fk_temp_issue_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_temp_issue_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_temp_issue_spare` FOREIGN KEY (`spare_id`) REFERENCES `spares` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_temp_issue_tool` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temporary_issue_local`
--

LOCK TABLES `temporary_issue_local` WRITE;
/*!40000 ALTER TABLE `temporary_issue_local` DISABLE KEYS */;
INSERT INTO `temporary_issue_local` VALUES (16,2,NULL,10,'ser 1 ','AER','2026-01-28',90,NULL,'[{\"no\": \"Rabc01\", \"qn\": \"20\", \"qtyHeld\": \"20\", \"location\": \"new location 2026\", \"withdraw\": \"5\"}, {\"no\": \"R0123\", \"qn\": \"25\", \"qtyHeld\": \"20\", \"location\": \"RACK-C\", \"withdraw\": \"5\"}]',NULL,2,'2026-01-28 14:24:58',NULL,NULL,NULL),(17,3,NULL,5,'ser 1 ','OMS','2026-01-28',35,NULL,'[{\"no\": \"R001\", \"qn\": \"9\", \"qtyHeld\": \"9\", \"location\": \"Reserved Room1\", \"quantity\": \"\", \"withdraw\": \"5\", \"boxNumber\": \"\"}]',NULL,2,'2026-01-28 14:25:36',NULL,NULL,NULL),(18,3,NULL,6,'ser 2 ','AER','2026-01-28',30,NULL,'[{\"no\": \"R001\", \"qn\": \"9\", \"qtyHeld\": \"9\", \"location\": \"Reserved Room1\", \"quantity\": \"\", \"withdraw\": \"6\", \"boxNumber\": \"\"}]',NULL,2,'2026-01-28 14:40:28',NULL,NULL,NULL),(19,2,NULL,10,'ser 1 ','FER','2026-01-28',10,NULL,'[{\"no\": \"Rabc01\", \"qn\": \"20\", \"qtyHeld\": \"20\", \"location\": \"new location 2026\", \"withdraw\": \"3\"}, {\"no\": \"R0123\", \"qn\": \"25\", \"qtyHeld\": \"20\", \"location\": \"RACK-C\", \"withdraw\": \"7\"}]',NULL,2,'2026-01-28 23:00:38',NULL,NULL,NULL),(20,2,NULL,5,'ser 1 ','AER','2026-01-28',10,NULL,'[{\"no\": \"Rabc01\", \"qn\": \"20\", \"qtyHeld\": \"12\", \"location\": \"new location 2026\", \"withdraw\": \"2\"}, {\"no\": \"R0123\", \"qn\": \"25\", \"qtyHeld\": \"8\", \"location\": \"RACK-C\", \"withdraw\": \"3\"}]',NULL,2,'2026-01-28 23:09:50',NULL,NULL,NULL),(21,2,NULL,5,'ser 1 ','AER','2026-01-28',10,NULL,'[{\"no\": \"Rabc01\", \"qn\": \"20\", \"qtyHeld\": \"7\", \"location\": \"new location 2026\"}, {\"no\": \"R0123\", \"qn\": \"25\", \"qtyHeld\": \"3\", \"location\": \"RACK-C\"}]',NULL,2,'2026-01-28 23:15:26',NULL,NULL,NULL);
/*!40000 ALTER TABLE `temporary_issue_local` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tools`
--

DROP TABLE IF EXISTS `tools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tools` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `equipment_system` varchar(255) DEFAULT NULL,
  `denos` varchar(255) DEFAULT NULL,
  `critical_tool` tinyint(1) NOT NULL DEFAULT '0',
  `obs_authorised` varchar(255) DEFAULT NULL,
  `obs_authorised_new` int DEFAULT NULL,
  `obs_held` varchar(255) DEFAULT NULL,
  `b_d_authorised` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `box_no` text,
  `item_distribution` varchar(255) DEFAULT NULL,
  `storage_location` varchar(255) DEFAULT NULL,
  `item_code` varchar(255) DEFAULT NULL,
  `indian_pattern` varchar(255) DEFAULT NULL,
  `remarks` text,
  `department` int DEFAULT NULL,
  `nac_date` varchar(63) DEFAULT NULL,
  `image` varchar(63) DEFAULT NULL,
  `uid` varchar(15) DEFAULT NULL,
  `oem` varchar(254) DEFAULT NULL,
  `substitute_name` varchar(127) DEFAULT NULL,
  `local_terminology` varchar(127) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `department` (`department`),
  CONSTRAINT `tools_ibfk_1` FOREIGN KEY (`department`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tools`
--

LOCK TABLES `tools` WRITE;
/*!40000 ALTER TABLE `tools` DISABLE KEYS */;
INSERT INTO `tools` VALUES (1,'Torque Wrench','CGT','Nos',0,'30',25,'30','2','P','[{\"no\":\"R001\",\"qn\":\"10\",\"qtyHeld\":\"22\",\"location\":\"FWD SPTA\"},{\"no\":\"R01\",\"qn\":\"20\",\"qtyHeld\":\"8\",\"location\":\"FWD SPTA\"}]',NULL,'FWD SPTA2','090088009-09','EM-867-67564MJOK',NULL,1,NULL,'image_1760940147067.jpg','1761368066432',NULL,NULL,NULL),(2,'TORQUE WRENCH','CGT','NOS',0,'40',NULL,'39',NULL,NULL,'[{\"no\":\"001\",\"qn\":\"20\",\"qtyHeld\":\"34\",\"location\":\"AER Workshop\"},{\"no\":\"002\",\"qn\":\"20\",\"qtyHeld\":\"5\",\"location\":\"FWD SPTA\"}]',NULL,'AER WORKSHOP',NULL,NULL,NULL,1,NULL,'null','1768222130089',NULL,NULL,NULL),(3,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,'TORQUE WRENCH','CGT','NOS',0,'30',NULL,'30',NULL,NULL,'[{\"no\":\"001\",\"qn\":\"10\",\"qtyHeld\":\"30\",\"location\":\"Reserved Room 1\"},{\"no\":\"002\",\"qn\":\"10\",\"qtyHeld\":\"0\",\"location\":\"AER Workshop\"},{\"no\":\"003\",\"qn\":\"10\",\"qtyHeld\":\"0\",\"location\":\"FWD SPTA\"}]',NULL,NULL,NULL,NULL,NULL,1,NULL,'null','1768633300957',NULL,' cc','cxc');
/*!40000 ALTER TABLE `tools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `password` varchar(255) NOT NULL,
  `sync_status` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'sougata','Sougata Talukdar','1','superadmin','$2b$10$CMTuTnRoxlTdw/2jlHXUy.inkteXXONFLF7UOxAFjuIvpS/wOspVi',0),(2,'avijit','Avijit Paul','1','admin','$2b$10$ViY4vQz6kYanZShNvyFyeeovr3lBVJdTSRG8EwUtIpGX.RlPMSP8G',0),(3,'subhadip','Subhadip Ghosh','2','admin','$2b$10$A/3fFx7c2dtQ/.LrnwQBPeWMhqOnFh8QKsrgqVidj8wsRPHcIA0iu',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-28 23:28:55
