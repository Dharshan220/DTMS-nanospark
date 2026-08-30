-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'ENTITY_CREATE', 'ENTITY_UPDATE', 'STATUS_CHANGE', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_DEACTIVATE', 'EMERGENCY_CREATE', 'EMERGENCY_ACKNOWLEDGE', 'EMERGENCY_RESOLVE', 'EMERGENCY_CANCEL', 'SCHEDULE_CREATE', 'SCHEDULE_UPDATE', 'SCHEDULE_CANCEL', 'SCHEDULE_OVERRIDE', 'ATTENDANCE_CREATE', 'ATTENDANCE_UPDATE', 'NOTIFICATION_SEND', 'NOTIFICATION_BULK_SEND', 'COMPLAINT_STATUS_CHANGE', 'FEEDBACK_STATUS_CHANGE');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_role" "Role" NOT NULL,
    "user_name" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "endpoint" TEXT,
    "http_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_resource_id_idx" ON "audit_logs"("resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_role_idx" ON "audit_logs"("user_role");
