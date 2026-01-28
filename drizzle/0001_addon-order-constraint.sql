-- Custom SQL migration file, put your code below! --

-- Add the deferrable unique constraint                                                                                                      
ALTER TABLE "addons" ADD CONSTRAINT "unique_user_order" UNIQUE ("user_id", "order") DEFERRABLE INITIALLY IMMEDIATE;  