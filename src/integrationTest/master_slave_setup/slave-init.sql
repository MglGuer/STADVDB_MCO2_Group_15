-- ADDITIONAL NOTE: Run this script for both node2 and node3 to set up replication, i'll put instructions in the README.md
-- also make sure to replace the MASTER_LOG_FILE and MASTER_LOG_POS with the values from SHOW MASTER STATUS
-- Set up replication on the slave
CHANGE MASTER TO
  MASTER_HOST='node1',
  MASTER_USER='replica',
  MASTER_PASSWORD='replica_password',
  MASTER_LOG_FILE='mysql-bin.000003', -- Replace with the log file from SHOW MASTER STATUS
  MASTER_LOG_POS=157;                  -- Replace with the position from SHOW MASTER STATUS
START SLAVE;

-- Check replication status
SHOW SLAVE STATUS\G;
