-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMERGENCY', 'COMPLAINT', 'FEEDBACK', 'TRANSPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TransportEventType" AS ENUM ('BUS_ASSIGNED', 'BUS_SWAPPED', 'BUS_REPLACED', 'BUS_CANCELLED', 'ROUTE_CHANGED', 'BUS_STOP_CHANGED', 'TRANSPORT_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "TransportNotificationTarget" AS ENUM ('ALL_STUDENTS', 'ALL_FACULTY', 'ALL_USERS', 'SPECIFIC_BUS', 'SPECIFIC_ROUTE', 'SPECIFIC_STUDENTS', 'SPECIFIC_FACULTY');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "provider_message_id" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_notification_events" (
    "id" TEXT NOT NULL,
    "event_type" "TransportEventType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_by" TEXT,
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transport_notification_events_idempotency_key_key" ON "transport_notification_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "transport_notification_events_event_type_idx" ON "transport_notification_events"("event_type");

-- CreateIndex
CREATE INDEX "transport_notification_events_entity_type_idx" ON "transport_notification_events"("entity_type");

-- CreateIndex
CREATE INDEX "transport_notification_events_entity_id_idx" ON "transport_notification_events"("entity_id");

-- CreateIndex
CREATE INDEX "transport_notification_events_created_at_idx" ON "transport_notification_events"("created_at");

-- CreateIndex
CREATE INDEX "transport_notification_events_idempotency_key_idx" ON "transport_notification_events"("idempotency_key");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
