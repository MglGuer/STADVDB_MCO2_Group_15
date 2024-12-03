-- Enable binary logging for replication
CREATE USER 'replica'@'%' IDENTIFIED WITH 'mysql_native_password' BY 'replica_password';
GRANT REPLICATION SLAVE ON *.* TO 'replica'@'%';
FLUSH PRIVILEGES;

-- Show binary log status for slaves
SHOW MASTER STATUS;
