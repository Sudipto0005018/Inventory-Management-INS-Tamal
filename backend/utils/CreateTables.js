const pool = require("./dbConnect");

async function createUsersTable() {
  const query = `
        create table users (
            id INT AUTO_INCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            department VARCHAR(100) default NULL,
            role VARCHAR(50) default 'user',
            password VARCHAR(255) NOT NULL,
            sync_status int default 0,
            PRIMARY KEY (id)
        );
    `;
  try {
    await pool.query(query);
    console.log("Users table created successfully.");
  } catch (error) {
    console.error("Error creating users table:", error);
  }
}

async function createDepartmentsTable() {
  const query = `
        create table departments (
            id INT AUTO_INCREMENT,
            name VARCHAR(100) UNIQUE NOT NULL,
            PRIMARY KEY (id)
        );
    `;
  try {
    await pool.query(query);
    console.log("Departments table created successfully.");
  } catch (error) {
    console.error("Error creating departments table:", error);
  }
}

async function createSparesTable() {
  const query = `
        CREATE TABLE spares (
            id INT PRIMARY KEY AUTO_INCREMENT,
            description VARCHAR(255) DEFAULT NULL,
            equipment_system VARCHAR(255) DEFAULT NULL,
            denos VARCHAR(255) DEFAULT NULL,
            obs_authorised VARCHAR(255) DEFAULT NULL,
            obs_held VARCHAR(255) DEFAULT NULL,
            b_d_authorised VARCHAR(255) DEFAULT NULL,
            category VARCHAR(255) DEFAULT NULL,
            box_no VARCHAR(255) DEFAULT NULL,
            item_distribution VARCHAR(255) DEFAULT NULL,
            storage_location VARCHAR(255) DEFAULT NULL,
            item_code VARCHAR(255) DEFAULT NULL,
            indian_pattern VARCHAR(255) DEFAULT NULL,
            remarks TEXT DEFAULT NULL,
            department INT DEFAULT NULL,
            image VARCHAR(32) DEFAULT NULL,
            FOREIGN KEY (department) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
  try {
    await pool.query(query);
    console.log("Spares table created successfully.");
  } catch (error) {
    console.error("Error creating spares table:", error);
  }
}
async function createToolsTable() {
  const query = `
        CREATE TABLE tools (
            id INT PRIMARY KEY AUTO_INCREMENT,
            description VARCHAR(255) DEFAULT NULL,
            equipment_system VARCHAR(255) DEFAULT NULL,
            denos VARCHAR(255) DEFAULT NULL,
            obs_authorised VARCHAR(255) DEFAULT NULL,
            obs_held VARCHAR(255) DEFAULT NULL,
            b_d_authorised VARCHAR(255) DEFAULT NULL,
            category VARCHAR(255) DEFAULT NULL,
            box_no VARCHAR(255) DEFAULT NULL,
            item_distribution VARCHAR(255) DEFAULT NULL,
            storage_location VARCHAR(255) DEFAULT NULL,
            item_code VARCHAR(255) DEFAULT NULL,
            indian_pattern VARCHAR(255) DEFAULT NULL,
            remarks TEXT DEFAULT NULL,
            department INT DEFAULT NULL,
            FOREIGN KEY (department) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
  try {
    await pool.query(query);
    console.log("Tools table created successfully.");
  } catch (error) {
    console.error("Error creating tools table:", error);
  }
}
async function createLPTable() {
  const query = `
        CREATE TABLE lp (
            id INT PRIMARY KEY AUTO_INCREMENT,
            description VARCHAR(255) DEFAULT NULL,
            equipment_system VARCHAR(255) DEFAULT NULL,
            denos VARCHAR(255) DEFAULT NULL,
            obs_authorised VARCHAR(255) DEFAULT NULL,
            obs_held VARCHAR(255) DEFAULT NULL,
            box_no VARCHAR(255) DEFAULT NULL,
            storage_location VARCHAR(255) DEFAULT NULL,
            remarks TEXT DEFAULT NULL,
            department INT DEFAULT NULL,
            FOREIGN KEY (department) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
  try {
    await pool.query(query);
    console.log("LP table created successfully.");
  } catch (error) {
    console.error("Error creating spares table:", error);
  }
}

async function createPendingTable() {
  const query = `
        CREATE TABLE pending (
            id INT PRIMARY KEY AUTO_INCREMENT,
            description VARCHAR(255) DEFAULT NULL,
            uid VARCHAR(34) DEFAULT NULL,
            quantity INT DEFAULT NULL,
            box_no text DEFAULT NULL,
            department INT DEFAULT NULL,
            demand_type VARCHAR(63) DEFAULT NULL,
            issued_to VARCHAR(63) DEFAULT NULL,
            issued_type VARCHAR(63) DEFAULT NULL,
            issue_date VARCHAR(63) DEFAULT NULL,
            servay_no VARCHAR(63) DEFAULT NULL,
            voucher_no VARCHAR(63) DEFAULT NULL,
            demand_no VARCHAR(63) DEFAULT NULL,
            nac_no VARCHAR(63) DEFAULT NULL,
            nac_date VARCHAR(63) DEFAULT NULL,
            survey_date VARCHAR(63) DEFAULT NULL,
            status VARCHAR(63) DEFAULT NULL,
            FOREIGN KEY (department) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
  try {
    await pool.query(query);
    console.log("Pending table created successfully.");
  } catch (error) {
    console.error("Error creating pending table:", error);
  }
}

async function createLoanTable() {
  const query = `
        CREATE TABLE loan_transaction (
            id INT PRIMARY KEY AUTO_INCREMENT,
            loan_id INT DEFAULT NULL,
            date VARCHAR(15) DEFAULT NULL,
            box_no TEXT DEFAULT NULL,
            quantity INT DEFAULT NULL,
            FOREIGN KEY (loan_id) REFERENCES pending(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
  try {
    await pool.query(query);
    console.log("Loan table created successfully.");
  } catch (error) {
    console.error("Error creating loan table:", error);
  }
}

async function createOemTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS oem(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            address TEXT DEFAULT NULL,
            contacts JSON DEFAULT NULL,
            details JSON DEFAULT NULL
        );
    `;
  try {
    await pool.query(query);
    console.log("Oem table created successfully.");
  } catch (error) {
    console.error("Error creating oem table:", error);
  }
}

async function createSupplierTable() {
  const query = `
        CREATE TABLE IF NOT EXISTS supplier(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            address TEXT DEFAULT NULL,
            contacts JSON DEFAULT NULL,
            details JSON DEFAULT NULL
        );
    `;
  try {
    await pool.query(query);
    console.log("Supplier table created successfully.");
  } catch (error) {
    console.error("Error creating supplier table:", error);
  }
}

module.exports = {
  createUsersTable,
  createDepartmentsTable,
  createSparesTable,
  createLPTable,
  createToolsTable,
  createPendingTable,
};
