CREATE TABLE `Problem` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`content` text NOT NULL,
	`answer` text NOT NULL,
	`imageKey` text,
	`zone` text DEFAULT 'TEMPORARY' NOT NULL,
	`masteryScore` real DEFAULT 50 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`passwordHash` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_username_unique` ON `User` (`username`);