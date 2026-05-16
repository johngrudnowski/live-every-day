CREATE TABLE "circle_support_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"support_person_id" text NOT NULL,
	"inviter_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"delivery_method" text NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "circle_support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"support_person_id" text NOT NULL,
	"patient_user_id" text NOT NULL,
	"author_user_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circle_support_invitations" ADD CONSTRAINT "circle_support_invitations_support_fk" FOREIGN KEY ("support_person_id") REFERENCES "public"."circle_support_people"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_invitations" ADD CONSTRAINT "circle_support_invitations_inviter_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_messages" ADD CONSTRAINT "circle_support_messages_support_fk" FOREIGN KEY ("support_person_id") REFERENCES "public"."circle_support_people"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_messages" ADD CONSTRAINT "circle_support_messages_patient_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "circle_support_messages" ADD CONSTRAINT "circle_support_messages_author_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "circle_support_invitations_support_person_idx" ON "circle_support_invitations" USING btree ("support_person_id");
--> statement-breakpoint
CREATE INDEX "circle_support_invitations_inviter_idx" ON "circle_support_invitations" USING btree ("inviter_user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "circle_support_invitations_token_hash_unique" ON "circle_support_invitations" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "circle_support_messages_support_person_idx" ON "circle_support_messages" USING btree ("support_person_id");
--> statement-breakpoint
CREATE INDEX "circle_support_messages_patient_created_at_idx" ON "circle_support_messages" USING btree ("patient_user_id","created_at");
--> statement-breakpoint
CREATE INDEX "circle_support_messages_author_idx" ON "circle_support_messages" USING btree ("author_user_id");
