-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: capex_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `capex_web`
--

DROP TABLE IF EXISTS `capex_web`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `capex_web` (
  `plano` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capex` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jan_ano` decimal(18,2) DEFAULT NULL,
  `fev_ano` decimal(18,2) DEFAULT NULL,
  `mar_ano` decimal(18,2) DEFAULT NULL,
  `abr_ano` decimal(18,2) DEFAULT NULL,
  `mai_ano` decimal(18,2) DEFAULT NULL,
  `jun_ano` decimal(18,2) DEFAULT NULL,
  `jul_ano` decimal(18,2) DEFAULT NULL,
  `ago_ano` decimal(18,2) DEFAULT NULL,
  `set_ano` decimal(18,2) DEFAULT NULL,
  `out_ano` decimal(18,2) DEFAULT NULL,
  `nov_ano` decimal(18,2) DEFAULT NULL,
  `dez_ano` decimal(18,2) DEFAULT NULL,
  `ordem` int NOT NULL DEFAULT '0',
  `meta` decimal(18,2) DEFAULT NULL,
  `status_capex` enum('PENDENTE','FINALIZADO','PARCIAL') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDENTE',
  `status_fisico` enum('SIM','NAO','PENDENTE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDENTE',
  PRIMARY KEY (`capex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `capex_web`
--

LOCK TABLES `capex_web` WRITE;
/*!40000 ALTER TABLE `capex_web` DISABLE KEYS */;
INSERT INTO `capex_web` VALUES ('plano','. Plano 1 - Expansão de Rede',41192.00,61320.00,79033.00,79111.00,90391.00,97244.00,63700.00,91745.00,97633.00,127582.00,105648.00,88102.00,1,1029764.00,'PENDENTE','PENDENTE'),('plano','. Plano 10 - Ferramentas e Serviços ',551.00,3339.00,2715.00,1573.00,3617.00,1695.00,1647.00,1996.00,4697.00,3727.00,9533.00,8304.00,59,47507.00,'PENDENTE','PENDENTE'),('plano','. Plano 11 - Veículos',1.00,6180.00,22643.00,2335.00,19855.00,21453.00,29734.00,19300.00,29703.00,12607.00,0.00,8501.00,67,180978.00,'PENDENTE','PENDENTE'),('plano','. Plano 12 - Infraestrutura',0.00,420.00,1749.00,335.00,1950.00,1220.00,2124.00,4661.00,4210.00,4435.00,0.00,0.00,72,43718.00,'PENDENTE','PENDENTE'),('plano','. Plano 13 - Geração',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,77,0.00,'PENDENTE','PENDENTE'),('subplano','. Plano 14 - Programa Luz para Todos',28201.00,28635.00,28506.00,34817.00,31308.00,29775.00,37137.00,37498.00,29261.00,18074.00,15391.00,19096.00,80,300536.00,'PENDENTE','PENDENTE'),('plano','. Plano 15 - Segurança Corporativa',61.00,695.00,860.00,319.00,607.00,646.00,868.00,983.00,1056.00,491.00,0.00,800.00,81,8186.00,'PENDENTE','PENDENTE'),('plano','. Plano 16 - Programa de Recuperação de Receita',6340.00,6820.00,6546.00,6858.00,7346.00,8144.00,7617.00,6167.00,9293.00,9850.00,12463.00,12469.00,85,106737.00,'PENDENTE','PENDENTE'),('plano','. Plano 2 - Projetos Especiais',603.00,355.00,8869.00,413.00,1021.00,911.00,1394.00,787.00,1266.00,350.00,9935.00,8897.00,5,38076.00,'PENDENTE','PENDENTE'),('plano','. Plano 3 - Renovação de Subestações ',2332.00,2735.00,4070.00,4056.00,4940.00,7178.00,12030.00,7260.00,6372.00,3959.00,8540.00,9783.00,12,73255.00,'PENDENTE','PENDENTE'),('plano','. Plano 4 - Renovação de Linhas (LT) ',1200.00,2572.00,2575.00,3678.00,2169.00,2112.00,1785.00,2322.00,2019.00,5784.00,826.00,1368.00,16,28896.00,'PENDENTE','PENDENTE'),('plano','. Plano 5 - Automação ',281.00,626.00,1529.00,471.00,1185.00,821.00,414.00,-1020.00,444.00,2165.00,775.00,808.00,20,8607.00,'PENDENTE','PENDENTE'),('plano','. Plano 6 - Telecomunicações ',1526.00,871.00,934.00,1111.00,1517.00,2872.00,1152.00,3147.00,5513.00,8723.00,4540.00,2122.00,26,36087.00,'PENDENTE','PENDENTE'),('plano','. Plano 7 - Novas Ligações',88252.00,92883.00,93789.00,97960.00,110433.00,108024.00,116973.00,119205.00,122838.00,128297.00,130024.00,123746.00,29,1268150.00,'PENDENTE','PENDENTE'),('plano','. Plano 8 - Renovação de Redes Distribuição',34733.00,31055.00,37404.00,42419.00,48310.00,41229.00,54655.00,49167.00,34665.00,42894.00,53660.00,54905.00,38,480043.00,'PENDENTE','PENDENTE'),('plano','. Plano 9 - Informática ',7638.00,5265.00,4438.00,9629.00,9961.00,8801.00,3728.00,6924.00,3595.00,18880.00,11308.00,19668.00,53,112548.00,'PENDENTE','PENDENTE'),('subplano','1.1.1 -  Subestações',8817.00,12242.00,19116.00,27868.00,30912.00,28947.00,19033.00,22589.00,399.00,25630.00,37235.00,47604.00,2,293118.00,'FINALIZADO','NAO'),('subplano','1.1.2 - Linhas de Transmissão',29685.00,39691.00,53583.00,44947.00,52267.00,57185.00,37689.00,59108.00,58571.00,89033.00,53883.00,28671.00,3,598280.00,'FINALIZADO','SIM'),('subplano','1.2 - Distribuição',2690.00,9386.00,6335.00,6295.00,7212.00,11112.00,6978.00,10047.00,19618.00,12920.00,14529.00,18189.00,4,138366.00,'FINALIZADO','PENDENTE'),('subplano','10.1 - Ferramentas e Equipamentos de Serviços MT',428.00,1262.00,456.00,846.00,3434.00,1616.00,1614.00,1543.00,3738.00,1406.00,853.00,2353.00,60,18049.00,'PENDENTE','PENDENTE'),('subplano','10.2 - Ferramentas e Equipamentos de Serviços LDAT',0.00,-50.00,21.00,4.00,5.00,9.00,8.00,251.00,103.00,39.00,20.00,2648.00,61,3058.00,'PENDENTE','PENDENTE'),('subplano','10.3.1 - Instrumento de Medição',0.00,1228.00,285.00,335.00,203.00,18.00,25.00,0.00,-239.00,263.00,485.00,50.00,62,5355.00,'PENDENTE','PENDENTE'),('subplano','10.3.5 - Instrumento de Medição - PDA Leitura',140.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,4923.00,0.00,63,5063.00,'PENDENTE','PENDENTE'),('subplano','10.4 - Ferramental - Pacote IV',-22.00,22.00,0.00,0.00,0.00,0.00,0.00,202.00,1094.00,1391.00,3252.00,3252.00,64,12202.00,'PENDENTE','PENDENTE'),('subplano','10.5 - Ferramentas e Equipamentos de Serviços SE',6.00,876.00,1953.00,389.00,-25.00,52.00,0.00,0.00,0.00,627.00,0.00,0.00,65,3781.00,'PENDENTE','PENDENTE'),('subplano','10.6 - Ferramental - Pacote III',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,66,0.00,'PENDENTE','PENDENTE'),('subplano','11.1 - Veículo Geral',1.00,6180.00,22643.00,2335.00,19855.00,21453.00,29734.00,-12812.00,1955.00,6290.00,0.00,0.00,68,98800.00,'PENDENTE','PENDENTE'),('subplano','11.2 - Veículos - Pacote IV',0.00,0.00,0.00,0.00,0.00,0.00,0.00,32112.00,27748.00,6317.00,0.00,8501.00,69,82178.00,'PENDENTE','PENDENTE'),('subplano','11.3 - Veículos Negócio',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,70,0.00,'PENDENTE','PENDENTE'),('subplano','11.4 - Veículos - Pacote III',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,71,0.00,'PENDENTE','PENDENTE'),('subplano','12.1 - Infraestrutura Geral',0.00,420.00,1749.00,335.00,1950.00,1137.00,2124.00,4659.00,2797.00,3892.00,0.00,0.00,73,26000.00,'PENDENTE','PENDENTE'),('subplano','12.2 - Infraestrutura Geral Pacote IV',0.00,0.00,0.00,0.00,0.00,0.00,0.00,2.00,1414.00,544.00,0.00,0.00,74,17635.00,'PENDENTE','PENDENTE'),('subplano','12.3 - Infraestrutura Geral Pacote III',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,75,0.00,'PENDENTE','PENDENTE'),('subplano','12.4 - Infraestrutura Negócio',0.00,0.00,0.00,0.00,0.00,83.00,0.00,0.00,0.00,0.00,0.00,0.00,76,83.00,'PENDENTE','PENDENTE'),('subplano','13.1 - Geração Recorrente',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,78,0.00,'PENDENTE','PENDENTE'),('subplano','13.2 - Projeto Noronha Verde',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,79,0.00,'PENDENTE','PENDENTE'),('subplano','15.1 - Infra Segurança Corporativa',61.00,695.00,860.00,319.00,607.00,646.00,868.00,983.00,1056.00,491.00,800.00,800.00,82,8186.00,'PENDENTE','PENDENTE'),('subplano','15.2 - Seg.Patrim.Internalizaç.Pacote IV',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,83,0.00,'PENDENTE','PENDENTE'),('subplano','15.3 - Seg.Patrim.Internalizaç.Pacote III',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,84,0.00,'PENDENTE','PENDENTE'),('subplano','16.1 - Regularização de Perdas',3635.00,4636.00,4780.00,4043.00,5989.00,6286.00,5642.00,4656.00,7507.00,7492.00,8819.00,8057.00,86,75308.00,'PENDENTE','PENDENTE'),('subplano','16.2 - Regularização de Inadimplência',1091.00,1483.00,1400.00,1845.00,1228.00,1561.00,1641.00,1609.00,1690.00,2002.00,2181.00,1809.00,87,15925.00,'PENDENTE','PENDENTE'),('subplano','16.3 - Blindagem BT',48.00,-1.00,132.00,11.00,-2.00,50.00,0.00,-12.00,3.00,0.00,0.00,0.00,88,238.00,'PENDENTE','PENDENTE'),('subplano','16.4 - Telemedição',519.00,88.00,-77.00,435.00,6.00,14.00,200.00,3.00,61.00,204.00,717.00,717.00,89,4085.00,'PENDENTE','PENDENTE'),('subplano','16.5 - Sensores Inteligentes',0.00,73.00,2.00,0.00,1.00,0.00,0.00,0.00,0.00,103.00,172.00,225.00,90,76.00,'PENDENTE','PENDENTE'),('subplano','16.6 - Centro de Medição',-1.00,0.00,0.00,0.00,1.00,0.00,0.00,0.00,0.00,-15.00,0.00,0.00,91,0.00,'PENDENTE','PENDENTE'),('subplano','16.7 - Blindagem MT/AT',2.00,1.00,0.00,-49.00,6.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,92,-40.00,'PENDENTE','PENDENTE'),('subplano','16.8 - Renovação SMC',1046.00,540.00,309.00,572.00,116.00,232.00,134.00,-89.00,32.00,64.00,575.00,1661.00,93,11145.00,'PENDENTE','PENDENTE'),('subplano','2.1 - Projeto Sistema Técnico BRR',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,11.00,0.00,0.00,2.00,6,0.00,'PENDENTE','PENDENTE'),('subplano','2.2 - Projeto Sistema Técnico BAR',22.00,30.00,27.00,26.00,15.00,23.00,25.00,30.00,48.00,38.00,29.00,62.00,7,517.00,'PENDENTE','PENDENTE'),('subplano','2.3   Cybersecurity',581.00,0.00,889.00,41.00,549.00,704.00,1177.00,572.00,890.00,11.00,9906.00,8835.00,8,24156.00,'FINALIZADO','PENDENTE'),('subplano','2.4 - DSO BRR',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,9,0.00,'FINALIZADO','PENDENTE'),('subplano','2.5 - DSO BAR',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,10,0.00,'FINALIZADO','PENDENTE'),('subplano','2.6 - Projetos TO',0.00,325.00,7953.00,347.00,457.00,184.00,192.00,184.00,328.00,302.00,0.00,0.00,11,13402.00,'FINALIZADO','PENDENTE'),('subplano','3.1 - Equipamentos SAE e Infraestrutura',255.00,955.00,1221.00,836.00,1057.00,4435.00,1061.00,1401.00,1324.00,1181.00,1604.00,3124.00,13,21165.00,'PENDENTE','PENDENTE'),('subplano','3.2 - Equipamentos de Subestação',1669.00,1367.00,2070.00,3109.00,3492.00,1898.00,10493.00,4958.00,3195.00,1923.00,6828.00,6550.00,14,47553.00,'PENDENTE','PENDENTE'),('subplano','3.3 - Intervenção de Emergência SE',409.00,413.00,779.00,110.00,391.00,845.00,476.00,901.00,1853.00,856.00,108.00,108.00,15,4537.00,'PENDENTE','PENDENTE'),('subplano','4.1 - Renovação de Linhas de Alta Tensão',1119.00,2290.00,2718.00,2551.00,1164.00,2212.00,1469.00,1988.00,1836.00,2480.00,443.00,600.00,17,21874.00,'PENDENTE','PENDENTE'),('subplano','4.2 - Melhoria da Qualidade - LAT',52.00,62.00,4.00,7.00,0.00,8.00,200.00,-33.00,155.00,2252.00,383.00,768.00,18,3858.00,'PENDENTE','PENDENTE'),('subplano','4.3 - Intervenção Emergencia LDAT',29.00,220.00,-148.00,1120.00,1006.00,-108.00,116.00,367.00,29.00,1052.00,0.00,0.00,19,3164.00,'PENDENTE','PENDENTE'),('subplano','5.1 - Automação de Subestação',281.00,613.00,1305.00,430.00,1103.00,747.00,384.00,-1001.00,411.00,2162.00,533.00,563.00,21,7531.00,'PENDENTE','PENDENTE'),('subplano','5.2 - Automação de Distribuição',0.00,13.00,224.00,41.00,81.00,74.00,30.00,-18.00,33.00,3.00,242.00,245.00,22,1076.00,'PENDENTE','PENDENTE'),('subplano','5.3 - Automação Centros de Controle',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,23,0.00,'PENDENTE','PENDENTE'),('subplano','5.4 - Automação - Segurança Cibernética ',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,24,0.00,'PENDENTE','PENDENTE'),('subplano','5.5 - Melhoria Alimentação Religadores SE',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,25,0.00,'PENDENTE','PENDENTE'),('subplano','6.1  - Implantação',601.00,848.00,916.00,206.00,1174.00,2448.00,1056.00,2839.00,5195.00,7462.00,4540.00,2122.00,27,31406.00,'PENDENTE','PENDENTE'),('subplano','6.2 -  O&M',925.00,23.00,18.00,905.00,343.00,424.00,96.00,308.00,318.00,1260.00,0.00,0.00,28,4681.00,'PENDENTE','PENDENTE'),('subplano','7.1 - Novas Ligações com Obra',58343.00,68509.00,76191.00,73703.00,78678.00,66968.00,87257.00,88240.00,87455.00,94780.00,83122.00,4165.00,30,869962.00,'FINALIZADO','PENDENTE'),('subplano','7.2 - Serviços Comerciais Ramal/Medidor',11690.00,11715.00,4465.00,10759.00,10269.00,13423.00,12410.00,11860.00,11735.00,12506.00,11995.00,14331.00,31,137157.00,'PENDENTE','PENDENTE'),('subplano','7.3 - Contrato Estado',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,32,0.00,'PENDENTE','PENDENTE'),('subplano','7.4 - Incorporação de Rede',1139.00,2495.00,1158.00,1343.00,2365.00,1937.00,327.00,4889.00,1014.00,668.00,1600.00,1722.00,33,20657.00,'PENDENTE','PENDENTE'),('subplano','7.5 - Medições SDAR e SDMT',312.00,155.00,8.00,100.00,156.00,412.00,129.00,233.00,41.00,169.00,300.00,805.00,34,3384.00,'PENDENTE','PENDENTE'),('subplano','7.6 - Telemedição Avançada',0.00,0.00,0.00,0.00,0.00,0.00,1893.00,0.00,0.00,0.00,0.00,0.00,35,1893.00,'PENDENTE','PENDENTE'),('subplano','7.7 - Obras em SE para Lig. de Cliente',2210.00,5756.00,5221.00,7042.00,5077.00,7526.00,4874.00,3220.00,6382.00,4461.00,3047.00,2415.00,36,57231.00,'PENDENTE','PENDENTE'),('subplano','7.8 - Obras em LDAT para Lig. de Cliente',14559.00,4253.00,6746.00,5012.00,13888.00,17758.00,10082.00,10763.00,16211.00,15713.00,29961.00,26920.00,37,177865.00,'PENDENTE','PENDENTE'),('plano','8.1-Intervenção em Rede',22956.00,17164.00,19819.00,24310.00,25299.00,21524.00,18265.00,23147.00,23216.00,23042.00,24590.00,22773.00,39,233289.00,'PENDENTE','PENDENTE'),('subplano','8.1.1-Intervenção Preventiva em Rede',1798.00,2466.00,1987.00,4053.00,5963.00,3893.00,-3248.00,2516.00,2663.00,2163.00,2054.00,5481.00,40,36349.00,'PENDENTE','PENDENTE'),('subplano','8.1.2-Intervenção Corretiva em Rede',17854.00,14025.00,14610.00,17296.00,16434.00,14404.00,17176.00,17203.00,17275.00,20442.00,17909.00,12846.00,41,168483.00,'PENDENTE','PENDENTE'),('subplano','8.1.3-Intervenção Preventiva em Equipamento',-24.00,50.00,5.00,-3.00,-80.00,1.00,3.00,603.00,13.00,17.00,116.00,196.00,42,888.00,'PENDENTE','PENDENTE'),('subplano','8.1.4-Intervenção Corretiva em Equipamento',534.00,1460.00,2719.00,2256.00,2558.00,2697.00,2522.00,1079.00,1959.00,1541.00,1906.00,1589.00,43,16432.00,'PENDENTE','PENDENTE'),('subplano','8.1.5-Intervenção Preventiva em Rede Subterrânea',2773.00,-938.00,-81.00,52.00,309.00,378.00,53.00,805.00,797.00,-1858.00,1773.00,1784.00,44,3845.00,'PENDENTE','PENDENTE'),('subplano','8.1.6-Intervenção Corretiva em Rede Subterrânea',21.00,102.00,579.00,656.00,115.00,151.00,1758.00,940.00,523.00,736.00,832.00,878.00,45,7291.00,'PENDENTE','PENDENTE'),('subplano','8.2-Melhoramento',5095.00,6622.00,7733.00,6828.00,8193.00,8087.00,18478.00,10847.00,903.00,4419.00,9373.00,10324.00,46,92924.00,'PENDENTE','PENDENTE'),('subplano','8.3-Deslocamento de RD',3937.00,2039.00,589.00,2075.00,3614.00,1643.00,2237.00,3094.00,1677.00,2366.00,3668.00,4061.00,47,21314.00,'PENDENTE','PENDENTE'),('subplano','8.4-Nível de Tensão',938.00,858.00,1991.00,3170.00,2406.00,2866.00,2140.00,3160.00,2268.00,2940.00,3920.00,4145.00,48,33475.00,'PENDENTE','PENDENTE'),('subplano','8.5 - Melhoramento BT',187.00,153.00,450.00,1131.00,395.00,2234.00,-2404.00,1148.00,-35.00,860.00,222.00,258.00,49,5888.00,'PENDENTE','PENDENTE'),('subplano','8.6 - Renovação de Rede de Segurança',1125.00,939.00,3656.00,2166.00,2199.00,1615.00,1876.00,1613.00,2736.00,1844.00,1555.00,1777.00,50,18260.00,'PENDENTE','PENDENTE'),('subplano','8.7 - Intervenção Corretiva Solar',0.00,49.00,989.00,625.00,1168.00,1995.00,2118.00,1315.00,1733.00,1849.00,1151.00,1000.00,51,11734.00,'PENDENTE','PENDENTE'),('subplano','8.8 - Melhoramento Rede Subterrânea',495.00,3231.00,2177.00,2114.00,5036.00,1265.00,11947.00,4844.00,2168.00,5573.00,9182.00,10568.00,52,63160.00,'PENDENTE','PENDENTE'),('subplano','9.1 - Informática Geral',7484.00,5103.00,4124.00,9350.00,9697.00,8625.00,3541.00,6735.00,3411.00,18632.00,11308.00,19668.00,54,107676.00,'PENDENTE','PENDENTE'),('subplano','9.2 - Conexão Digital',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,55,0.00,'PENDENTE','PENDENTE'),('subplano','9.3 - Informática - Pacote IV',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,56,11.00,'PENDENTE','PENDENTE'),('subplano','9.5 - Informática - Pacote III',0.00,0.00,0.00,0.00,189.00,-13.00,0.00,0.00,0.00,0.00,0.00,0.00,58,176.00,'PENDENTE','PENDENTE');
/*!40000 ALTER TABLE `capex_web` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `capexpermission`
--

DROP TABLE IF EXISTS `capexpermission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `capexpermission` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capexLabel` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `capexpermission_userId_capexLabel_key` (`userId`,`capexLabel`),
  CONSTRAINT `capexpermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `capexpermission`
--

LOCK TABLES `capexpermission` WRITE;
/*!40000 ALTER TABLE `capexpermission` DISABLE KEYS */;
INSERT INTO `capexpermission` VALUES ('cml33q0qp000112jszrduu6t8','cmkxa90i1000413fzjffbw4om','2.4 - DSO BRR','2026-02-01 02:08:10.561'),('cml40tlwv0003qg0td6ygz6s9','cmkxa90i1000413fzjffbw4om','1.1.1 -  Subestações','2026-02-01 17:34:45.291'),('cmlod7gk00004dsmh7ixc2kpm','cmjm3gaxc0000fr512mwl2lr5','1.1.1 -  Subestações','2026-02-15 23:16:50.413');
/*!40000 ALTER TABLE `capexpermission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carimbos`
--

DROP TABLE IF EXISTS `carimbos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carimbos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `ordem` int NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carimbos_nome_key` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carimbos`
--

LOCK TABLES `carimbos` WRITE;
/*!40000 ALTER TABLE `carimbos` DISABLE KEYS */;
INSERT INTO `carimbos` VALUES (1,'Plano Verão',1,0,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(2,'Contingência Térmica',1,1,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(3,'Projetos Especiais',1,2,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(4,'Pacote IV',1,3,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(5,'Qualidade do Produto',1,4,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(6,'Nível de Tensão',1,5,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(7,'DEC',1,6,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(8,'FEC',1,7,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(9,'TMAE',1,8,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(10,'Perdas Técnicas',1,9,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(11,'Perdas',1,10,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(12,'Veículos',1,11,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(13,'Infraestrutura',1,12,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(14,'Melhoramento BT',1,13,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(15,'Expansão de Redes',1,14,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(16,'Expansão de Linhas',1,15,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098'),(17,'Expansão de SE',1,16,'2026-03-01 13:41:39.098','2026-03-01 13:41:39.098');
/*!40000 ALTER TABLE `carimbos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passwordresettoken`
--

DROP TABLE IF EXISTS `passwordresettoken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passwordresettoken` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `usedAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `tokenHash` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `passwordresettoken_tokenHash_key` (`tokenHash`),
  KEY `passwordresettoken_userId_idx` (`userId`),
  KEY `passwordresettoken_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `passwordresettoken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordresettoken`
--

LOCK TABLES `passwordresettoken` WRITE;
/*!40000 ALTER TABLE `passwordresettoken` DISABLE KEYS */;
/*!40000 ALTER TABLE `passwordresettoken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissionrequest`
--

DROP TABLE IF EXISTS `permissionrequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissionrequest` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capexLabel` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `decidedAt` datetime(3) DEFAULT NULL,
  `decidedByUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permissionrequest_status_idx` (`status`),
  KEY `permissionrequest_userId_idx` (`userId`),
  KEY `permissionrequest_decidedByUserId_idx` (`decidedByUserId`),
  CONSTRAINT `permissionrequest_decidedByUserId_fkey` FOREIGN KEY (`decidedByUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `permissionrequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissionrequest`
--

LOCK TABLES `permissionrequest` WRITE;
/*!40000 ALTER TABLE `permissionrequest` DISABLE KEYS */;
INSERT INTO `permissionrequest` VALUES ('cmlocsdti0000dsmhbvdij1yh','cmjm3gaxc0000fr512mwl2lr5','1.1.1 -  Subestações','dfgfd','APPROVED','2026-02-15 23:05:07.057','2026-02-15 23:16:50.376','cmjm3hf0e0003fr513eafjnnj'),('cmlocsdu50001dsmhume6ky6c','cmjm3gaxc0000fr512mwl2lr5','2.1 - Projeto Sistema Técnico BRR','dfgfd','REJECTED','2026-02-15 23:05:07.057','2026-02-15 23:52:12.037','cmjm3hf0e0003fr513eafjnnj'),('cmlocsdu50002dsmh3wiumat6','cmjm3gaxc0000fr512mwl2lr5','2.3   Cybersecurity','dfgfd','APPROVED','2026-02-15 23:05:07.057','2026-02-15 23:52:15.211','cmjm3hf0e0003fr513eafjnnj');
/*!40000 ALTER TABLE `permissionrequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `physicalinput`
--

DROP TABLE IF EXISTS `physicalinput`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `physicalinput` (
  `id` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `risco` enum('BAIXO','MEDIO','ALTO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BAIXO',
  `jan` decimal(18,2) NOT NULL DEFAULT '0.00',
  `fev` decimal(18,2) NOT NULL DEFAULT '0.00',
  `mar` decimal(18,2) NOT NULL DEFAULT '0.00',
  `abr` decimal(18,2) NOT NULL DEFAULT '0.00',
  `mai` decimal(18,2) NOT NULL DEFAULT '0.00',
  `jun` decimal(18,2) NOT NULL DEFAULT '0.00',
  `jul` decimal(18,2) NOT NULL DEFAULT '0.00',
  `ago` decimal(18,2) NOT NULL DEFAULT '0.00',
  `set` decimal(18,2) NOT NULL DEFAULT '0.00',
  `out` decimal(18,2) NOT NULL DEFAULT '0.00',
  `nov` decimal(18,2) NOT NULL DEFAULT '0.00',
  `dez` decimal(18,2) NOT NULL DEFAULT '0.00',
  `capexLabel` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PhysicalInput_name_capexLabel_key` (`name`,`capexLabel`),
  KEY `PhysicalInput_capexLabel_fkey` (`capexLabel`),
  CONSTRAINT `PhysicalInput_capexLabel_fkey` FOREIGN KEY (`capexLabel`) REFERENCES `capex_web` (`capex`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `physicalinput`
--

LOCK TABLES `physicalinput` WRITE;
/*!40000 ALTER TABLE `physicalinput` DISABLE KEYS */;
INSERT INTO `physicalinput` VALUES (9,'2026-02-22 22:56:38.186','2026-02-22 22:56:38.186','d','BAIXO',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,58571.00,89033.00,53883.00,28671.00,'1.1.2 - Linhas de Transmissão'),(10,'2026-02-22 22:56:46.834','2026-02-22 22:56:46.834','asdasd','BAIXO',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,213.00,0.00,0.00,0.00,'1.1.1 -  Subestações');
/*!40000 ALTER TABLE `physicalinput` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `planos_desc`
--

DROP TABLE IF EXISTS `planos_desc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planos_desc` (
  `tipo` varchar(191) DEFAULT NULL,
  `natureza` varchar(191) DEFAULT NULL,
  `plano_text` varchar(191) DEFAULT NULL,
  `id` varchar(191) DEFAULT NULL,
  `plano_investimento` varchar(191) NOT NULL,
  `plano` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`plano_investimento`),
  UNIQUE KEY `planos_desc_plano_investimento_key` (`plano_investimento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planos_desc`
--

LOCK TABLES `planos_desc` WRITE;
/*!40000 ALTER TABLE `planos_desc` DISABLE KEYS */;
INSERT INTO `planos_desc` VALUES ('REDES','Expansão de Rede','. Plano 14 - Programa Luz para Todos','14','. Plano 14 - Programa Luz para Todos','subplano'),('SE/LT','Expansão de Rede','. Plano 1 - Expansão de Rede','1.1.1','1.1.1 -  Subestações','subplano'),('SE/LT','Expansão de Rede','. Plano 1 - Expansão de Rede','1.1.2','1.1.2 - Linhas de Transmissão','subplano'),('REDES','Expansão de Rede','. Plano 1 - Expansão de Rede','1.2','1.2 - Distribuição','subplano'),('REDES','Outros','. Plano 10 - Ferramentas e Serviços ','10.1','10.1 - Ferramentas e Equipamentos de Serviços MT','subplano'),('SE/LT','Outros','. Plano 10 - Ferramentas e Serviços ','10.2','10.2 - Ferramentas e Equipamentos de Serviços LDAT','subplano'),('REDES','Outros','. Plano 10 - Ferramentas e Serviços ','10.3','10.3.1 - Instrumento de Medição','subplano'),('REDES','Outros','. Plano 10 - Ferramentas e Serviços ','10.3.5','10.3.5 - Instrumento de Medição - PDA Leitura','subplano'),('REDES','Outros','. Plano 10 - Ferramentas e Serviços ','10.4','10.4 - Ferramental - Pacote IV','subplano'),('SE/LT','Outros','. Plano 10 - Ferramentas e Serviços ','10.5','10.5 - Ferramentas e Equipamentos de Serviços SE','subplano'),('REDES','Outros','. Plano 10 - Ferramentas e Serviços ','10.6','10.6 - Ferramental - Pacote III','subplano'),('OUTROS','Outros','. Plano 11 - Veículos','11.1','11.1 - Veículo Geral','subplano'),('OUTROS','Outros','. Plano 11 - Veículos','11.2','11.2 - Veículos - Pacote IV','subplano'),('OUTROS','Outros','. Plano 11 - Veículos','11.3','11.3 - Veículos Negócio','subplano'),('OUTROS','Outros','. Plano 11 - Veículos','11.4','11.4 - Veículos - Pacote III','subplano'),('OUTROS','Outros','. Plano 12 - Infraestrutura','12.1','12.1 - Infraestrutura Geral','subplano'),('OUTROS','Outros','. Plano 12 - Infraestrutura','12.2','12.2 - Infraestrutura Geral Pacote IV','subplano'),('OUTROS','Outros','. Plano 12 - Infraestrutura','12.3','12.3 - Infraestrutura Geral Pacote III','subplano'),('OUTROS','Outros','. Plano 12 - Infraestrutura','12.4','12.4 - Infraestrutura Negócio','subplano'),('OUTROS','Renovação de Ativos','. Plano 13 - Geração','13.1','13.1 - Geração Recorrente','subplano'),('OUTROS','Renovação de Ativos','. Plano 13 - Geração','13.2','13.2 - Projeto Noronha Verde','subplano'),('OUTROS','Outros','. Plano 15 - Segurança Corporativa','15.1','15.1 - Infra Segurança Corporativa','subplano'),('OUTROS','Outros','. Plano 15 - Segurança Corporativa','15.2','15.2 - Seg.Patrim.Internalizaç.Pacote IV','subplano'),('OUTROS','Outros','. Plano 15 - Segurança Corporativa','15.3','15.3 - Seg.Patrim.Internalizaç.Pacote III','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.1','16.1 - Regularização de Perdas','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.2','16.2 - Regularização de Inadimplência','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.3','16.3 - Blindagem BT','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.4','16.4 - Telemedição','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.5','16.5 - Sensores Inteligentes','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.6','16.6 - Centro de Medição','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.7','16.7 - Blindagem MT/AT','subplano'),('REDES','Recuperação de Receita','. Plano 16 - Programa de Recuperação de Receita','16.8','16.8 - Renovação SMC','subplano'),('OUTROS','Outros','. Plano 2 - Projetos Especiais','2.1','2.1 - Projeto Sistema Técnico BRR','subplano'),('OUTROS','Outros','. Plano 2 - Projetos Especiais','2.2','2.2 - Projeto Sistema Técnico BAR','subplano'),('OUTROS','Outros','. Plano 2 - Projetos Especiais','2.3','2.3   Cybersecurity','subplano'),('OUTROS','Outros','. Plano 2 - Projetos Especiais','2.4','2.4 - DSO BRR','subplano'),('OUTROS','Outros','. Plano 2 - Projetos Especiais','2.5','2.5 - DSO BAR','subplano'),('OUTROS','Outros','. Plano 2 - Projetos Especiais','2.6','2.6 - Projetos TO','subplano'),('SE/LT','Renovação de Ativos','. Plano 3 - Renovação de Subestações ','3.1','3.1 - Equipamentos SAE e Infraestrutura','subplano'),('SE/LT','Renovação de Ativos','. Plano 3 - Renovação de Subestações ','3.2','3.2 - Equipamentos de Subestação','subplano'),('SE/LT','Renovação de Ativos','. Plano 3 - Renovação de Subestações ','3.3','3.3 - Intervenção de Emergência SE','subplano'),('SE/LT','Renovação de Ativos','. Plano 4 - Renovação de Linhas (LT) ','4.1','4.1 - Renovação de Linhas de Alta Tensão','subplano'),('SE/LT','Melhoria de Rede','. Plano 4 - Renovação de Linhas (LT) ','4.2','4.2 - Melhoria da Qualidade - LAT','subplano'),('SE/LT','Renovação de Ativos','. Plano 4 - Renovação de Linhas (LT) ','4.3','4.3 - Intervenção Emergencia LDAT','subplano'),('SE/LT','Melhoria de Rede','. Plano 5 - Automação ','5.1','5.1 - Automação de Subestação','subplano'),('REDES','Melhoria de Rede','. Plano 5 - Automação ','5.2','5.2 - Automação de Distribuição','subplano'),('OUTROS','Melhoria de Rede','. Plano 5 - Automação ','5.3','5.3 - Automação Centros de Controle','subplano'),('OUTROS','Melhoria de Rede','. Plano 5 - Automação ','5.4','5.4 - Automação - Segurança Cibernética ','subplano'),('SE/LT','Melhoria de Rede','. Plano 5 - Automação ','5.5','5.5 - Melhoria Alimentação Religadores SE','subplano'),('REDES','Melhoria de Rede','. Plano 6 - Telecomunicações ','6.1','6.1  - Implantação','subplano'),('REDES','Melhoria de Rede','. Plano 6 - Telecomunicações ','6.2','6.2 -  O&M','subplano'),('REDES','Expansão de Rede','. Plano 7 - Novas Ligações','7.1','7.1 - Novas Ligações com Obra','subplano'),('REDES','Expansão de Rede','. Plano 7 - Novas Ligações','7.2','7.2 - Serviços Comerciais Ramal/Medidor','subplano'),('REDES','Expansão de Rede','. Plano 7 - Novas Ligações','7.3','7.3 - Contrato Estado','subplano'),('REDES','Expansão de Rede','. Plano 7 - Novas Ligações','7.4','7.4 - Incorporação de Rede','subplano'),('REDES','Expansão de Rede','. Plano 7 - Novas Ligações','7.5','7.5 - Medições SDAR e SDMT','subplano'),('REDES','Expansão de Rede','. Plano 7 - Novas Ligações','7.6','7.6 - Telemedição Avançada','subplano'),('SE/LT','Expansão de Rede','. Plano 7 - Novas Ligações','7.7','7.7 - Obras em SE para Lig. de Cliente','subplano'),('SE/LT','Expansão de Rede','. Plano 7 - Novas Ligações','7.8','7.8 - Obras em LDAT para Lig. de Cliente','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.1.1','8.1.1-Intervenção Preventiva em Rede','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.1.2','8.1.2-Intervenção Corretiva em Rede','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.1.3','8.1.3-Intervenção Preventiva em Equipamento','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.1.4','8.1.4-Intervenção Corretiva em Equipamento','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.1.5','8.1.5-Intervenção Preventiva em Rede Subterrânea','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.1.6','8.1.6-Intervenção Corretiva em Rede Subterrânea','subplano'),('REDES','Melhoria de Rede','. Plano 8 - Renovação de Redes Distribuição','8.2','8.2-Melhoramento','subplano'),('REDES','Melhoria de Rede','. Plano 8 - Renovação de Redes Distribuição','8.3','8.3-Deslocamento de RD','subplano'),('REDES','Melhoria de Rede','. Plano 8 - Renovação de Redes Distribuição','8.4','8.4-Nível de Tensão','subplano'),('REDES','Melhoria de Rede','. Plano 8 - Renovação de Redes Distribuição','8.5','8.5 - Melhoramento BT','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.6','8.6 - Renovação de Rede de Segurança','subplano'),('REDES','Renovação de Ativos','. Plano 8 - Renovação de Redes Distribuição','8.7','8.7 - Intervenção Corretiva Solar','subplano'),('REDES','Melhoria de Rede','. Plano 8 - Renovação de Redes Distribuição','8.8','8.8 - Melhoramento Rede Subterrânea','subplano'),('OUTROS','Outros','. Plano 9 - Informática ','9.1','9.1 - Informática Geral','subplano'),('OUTROS','Outros','. Plano 9 - Informática ','9.2','9.2 - Conexão Digital','subplano'),('OUTROS','Outros','. Plano 9 - Informática ','9.3','9.3 - Informática - Pacote IV','subplano'),('OUTROS','Outros','. Plano 9 - Informática ','9.4','9.4 - Informática Negócio','subplano'),('OUTROS','Outros','. Plano 9 - Informática ','9.5','9.5 - Informática - Pacote III','subplano');
/*!40000 ALTER TABLE `planos_desc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitacao_recursos`
--

DROP TABLE IF EXISTS `solicitacao_recursos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitacao_recursos` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `plano_investimento` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor_aporte` decimal(18,2) NOT NULL,
  `desc_fisico` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `justificativa` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_solicitante` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jan` decimal(18,2) NOT NULL DEFAULT '0.00',
  `fev` decimal(18,2) NOT NULL DEFAULT '0.00',
  `mar` decimal(18,2) NOT NULL DEFAULT '0.00',
  `abr` decimal(18,2) NOT NULL DEFAULT '0.00',
  `mai` decimal(18,2) NOT NULL DEFAULT '0.00',
  `jun` decimal(18,2) NOT NULL DEFAULT '0.00',
  `jul` decimal(18,2) NOT NULL DEFAULT '0.00',
  `ago` decimal(18,2) NOT NULL DEFAULT '0.00',
  `set` decimal(18,2) NOT NULL DEFAULT '0.00',
  `out` decimal(18,2) NOT NULL DEFAULT '0.00',
  `nov` decimal(18,2) NOT NULL DEFAULT '0.00',
  `dez` decimal(18,2) NOT NULL DEFAULT '0.00',
  `status_solicitacao` enum('pendente','aprovado','rejeitado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `decidedAt` datetime DEFAULT NULL,
  `decidedByEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carimboid` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `solicitacao_recursos_status_solicitacao_idx` (`status_solicitacao`),
  KEY `solicitacao_recursos_carimboid_idx` (`carimboid`),
  CONSTRAINT `solicitacao_recursos_carimboid_fkey` FOREIGN KEY (`carimboid`) REFERENCES `carimbos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitacao_recursos`
--

LOCK TABLES `solicitacao_recursos` WRITE;
/*!40000 ALTER TABLE `solicitacao_recursos` DISABLE KEYS */;
INSERT INTO `solicitacao_recursos` VALUES ('cmlmypv890000r2oefe1t4shf','2026-02-14 23:43:28.854','1.2 - Distribuição',500.00,'Instalar','k','matheus.paiva@neoenergia.com',0.00,0.00,0.00,0.00,0.00,0.00,0.00,500.00,0.00,0.00,0.00,0.00,'aprovado','2026-02-15 19:10:49',NULL,NULL),('cmlmz2qkm0001r2oecmz0jf2g','2026-02-14 23:53:29.350','10.6 - Ferramental - Pacote III',20.00,'t6ytrty','rtyrty','matheus.paiva@neoenergia.com',0.00,10.00,0.00,0.00,0.00,0.00,0.00,0.00,10.00,0.00,0.00,0.00,'aprovado','2026-02-15 19:10:48',NULL,NULL),('cmlo8u58y0000w0mo0p39b02h','2026-02-15 21:14:30.794','2.4 - DSO BRR',300000.00,'Compra de 4 caixas de brahma','Carnaval','matheus.paiva@neoenergia.com',0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,100000.00,100000.00,100000.00,'rejeitado','2026-02-15 21:14:37',NULL,NULL),('cmm7sv4ov0000aazhb6k040vq','2026-03-01 13:42:46.399','1.2 - Distribuição',10.00,'sei la','ahahaha','matheus.paiva@neoenergia.com',0.00,0.00,0.00,0.00,10.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,'rejeitado','2026-03-01 13:43:08',NULL,1),('cmm80wjgx0000bi5y7hjp8ulw','2026-03-01 17:27:49.137','12.1 - Infraestrutura Geral',400000.00,'sadsadasdasdasdasdasdasdscxzcxzcxzcxzcxzsadas asdasdsad asd','asd asdasd asd sadas dasd asdasd asdasd as dasd a','matheus.paiva@neoenergia.com',50000.00,50000.00,50000.00,50000.00,0.00,50000.00,50000.00,50000.00,0.00,0.00,0.00,50000.00,'aprovado','2026-03-01 17:27:55',NULL,7);
/*!40000 ALTER TABLE `solicitacao_recursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(18,2) NOT NULL,
  `fromCapex` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `toCapex` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transfers_fromCapex_idx` (`fromCapex`),
  KEY `transfers_toCapex_idx` (`toCapex`),
  CONSTRAINT `transfers_fromCapex_fkey` FOREIGN KEY (`fromCapex`) REFERENCES `capex_web` (`capex`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transfers_toCapex_fkey` FOREIGN KEY (`toCapex`) REFERENCES `capex_web` (`capex`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transfers`
--

LOCK TABLES `transfers` WRITE;
/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
INSERT INTO `transfers` VALUES (23,687.00,'1.2 - Distribuição','4.3 - Intervenção Emergencia LDAT'),(25,52.00,'1.1.1 -  Subestações','2.6 - Projetos TO');
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passwordHash` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('USER','EDITOR','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmjm3gaxc0000fr512mwl2lr5','matheuspg007@gmail.com','MATHEUS VICTOR DE PAIVA GERMANO','$2b$10$NhnWTUPIdMDJqk30OXQve.JDQUkXNmfc2eC4fujMhnjt0zZrtd8wy','USER','2025-12-25 23:48:49.873','2026-02-22 01:41:02.222'),('cmjm3hf0e0003fr513eafjnnj','matheus.paiva@neoenergia.com','MATHEUS VICTOR DE PAIVA GERMANO2','$2b$10$U18KN9PeggJr3vJ/2LzG/ubTbyuIWj7azuO6.3KudURzDUxavo5T6','ADMIN','2025-12-25 23:49:41.822','2026-03-01 17:48:58.870'),('cmkxa90i1000413fzjffbw4om','anabeatriz@gmail.com','ANA BEATRIZ','$2b$10$OAaV0gHv7jmYujNPAUm0U.jO/3hHaEV6C97QugFCqcSMwbCa9EjF.','USER','2026-01-28 00:24:17.354','2026-02-01 17:43:00.201');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-01 22:02:22
