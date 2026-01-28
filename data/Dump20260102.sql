-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: inventory_ins
-- ------------------------------------------------------
-- Server version	9.3.0

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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending`
--

LOCK TABLES `pending` WRITE;
/*!40000 ALTER TABLE `pending` DISABLE KEYS */;
INSERT INTO `pending` VALUES (17,'1761367336982',4,1,NULL,'aer','20251027',NULL,NULL,NULL,NULL,NULL,NULL,'temporary','[{\"no\":\"009\",\"qn\":\"4\"}]','issued',NULL,NULL,NULL,NULL,10,NULL,NULL,'complete'),(18,'1761368066432',7,1,NULL,NULL,'20251027',NULL,NULL,NULL,NULL,NULL,NULL,'loan','[{\"no\":\"021\",\"qn\":0},{\"no\":\"022\",\"qn\":\"7\"}]','issued','One','Two','Three','9876543210',20,'Four',NULL,'complete'),(19,'1761367371154',5,1,NULL,'oms','20251026',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":0},{\"no\":\"008\",\"qn\":\"5\"}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(20,'1761367336982',2,1,NULL,'aer','20251027',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":\"2\"}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(28,'1761367371154',6,1,NULL,'aer','20251027',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":\"6\"},{\"no\":\"008\",\"qn\":0}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete'),(48,'1761367336982',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(49,'1761368066432',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(50,'1761367371154',6,1,NULL,'oms','20251028',NULL,NULL,NULL,NULL,NULL,NULL,'permanent','[{\"no\":\"009\",\"qn\":\"4\"},{\"no\":\"008\",\"qn\":\"2\"}]','issued',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'complete');
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
  `obs_authorised` varchar(255) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spares`
--

LOCK TABLES `spares` WRITE;
/*!40000 ALTER TABLE `spares` DISABLE KEYS */;
INSERT INTO `spares` VALUES (1,'Throttle Cock Unit','CGT','Nos','1','7',NULL,'P','[{\"no\":\"009\",\"qn\":7}]',NULL,'Fwd SPTA','090088009-06','EM-867-67564MJOK',NULL,1,'image_1760961120676.jpg',NULL,'1761367336982',NULL,NULL,NULL),(2,'Telephone','CGT','Nos','2','7',NULL,'P','[{\"no\":\"009\",\"qn\":3},{\"no\":\"008\",\"qn\":4}]',NULL,'Fwd SPTA','090088009-07',NULL,NULL,1,'image_1760940071913.jpg','20251020','1761367371154',NULL,NULL,NULL);
/*!40000 ALTER TABLE `spares` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `obs_authorised` varchar(255) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tools`
--

LOCK TABLES `tools` WRITE;
/*!40000 ALTER TABLE `tools` DISABLE KEYS */;
INSERT INTO `tools` VALUES (1,'Torque Wrench','CGT','Nos','1','1','2','P','[{\"no\":\"021\",\"qn\":5},{\"no\":\"022\",\"qn\":\"8\"}]',NULL,'Fwd SPTA','090088009-09','EM-867-67564MJOK',NULL,1,NULL,'image_1760940147067.jpg','1761368066432',NULL,NULL,NULL);
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

-- Dump completed on 2026-01-02 16:19:58
