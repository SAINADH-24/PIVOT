CREATE TABLE `recharge_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`validity` integer NOT NULL,
	`data_amount` integer NOT NULL,
	`data_mode` text NOT NULL,
	`voice_calls` integer DEFAULT false NOT NULL,
	`unlimited_voice` integer DEFAULT false NOT NULL,
	`ott_platforms` text,
	`total_cost` integer NOT NULL,
	`pivot_points_earned` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`activated_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`recipient_phone` text,
	`recipient_udi` text,
	`network` text,
	`fee` integer NOT NULL,
	`cost` integer,
	`validity` integer,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `udi_devices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`phone_number` text NOT NULL,
	`udi_id` text NOT NULL,
	`data_used` real DEFAULT 0 NOT NULL,
	`last_connected` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `udi_devices_udi_id_unique` ON `udi_devices` (`udi_id`);--> statement-breakpoint
CREATE TABLE `usage_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`date` text NOT NULL,
	`gb_used` real NOT NULL,
	`primary_category` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`password` text NOT NULL,
	`data_balance` real DEFAULT 15.5 NOT NULL,
	`pivot_points` integer DEFAULT 1250 NOT NULL,
	`two_factor_enabled` integer DEFAULT false NOT NULL,
	`two_factor_method` text DEFAULT 'sms' NOT NULL,
	`udi` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_udi_unique` ON `users` (`udi`);--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
