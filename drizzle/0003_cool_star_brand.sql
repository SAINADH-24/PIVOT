CREATE TABLE `pivot_point_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`price_inr` integer,
	`stripe_session_id` text,
	`stripe_payment_intent_id` text,
	`package_label` text,
	`bonus_points` integer DEFAULT 0,
	`description` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
