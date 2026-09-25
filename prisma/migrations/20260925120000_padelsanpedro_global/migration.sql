-- PadelSanPedro Global Architecture Migration
-- Make User, Community, OpenMatch, Ranking and Categories models global across San Pedro

-- UserSession
ALTER TABLE `usersession` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `UserSession_tenantId_idx` ON `usersession`(`tenantId`);
CREATE INDEX `UserSession_userId_expiresAt_idx` ON `usersession`(`userId`, `expiresAt`);
DROP INDEX `UserSession_tenantId_userId_expiresAt_idx` ON `usersession`;

-- User
ALTER TABLE `user` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `User_dni_key` ON `user`(`dni`);
CREATE UNIQUE INDEX `User_email_key` ON `user`(`email`);
CREATE INDEX `User_looking_public_idx` ON `user`(`lookingForPartner`, `isProfilePublic`);
DROP INDEX `User_tenantId_email_key` ON `user`;
DROP INDEX `User_tenantId_dni_key` ON `user`;
DROP INDEX `User_tenantId_looking_public_idx` ON `user`;

-- RankingCategory
ALTER TABLE `rankingcategory` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `RankingCategory_published_order_idx` ON `rankingcategory`(`isPublished`, `displayOrder`);

-- RankingEntry
ALTER TABLE `rankingentry` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `RankingEntry_tenantId_idx` ON `rankingentry`(`tenantId`);
CREATE INDEX `RankingEntry_category_points_idx` ON `rankingentry`(`categoryId`, `points`);
CREATE INDEX `RankingEntry_category_manual_idx` ON `rankingentry`(`categoryId`, `manualPosition`);
CREATE UNIQUE INDEX `RankingEntry_category_user_key` ON `rankingentry`(`categoryId`, `userId`);
DROP INDEX `RankingEntry_tenant_category_user_key` ON `rankingentry`;

-- PlayerCategoryLevel
ALTER TABLE `playercategorylevel` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `PlayerCategoryLevel_name_key` ON `playercategorylevel`(`name`);
CREATE INDEX `PlayerCategoryLevel_published_order_idx` ON `playercategorylevel`(`isPublished`, `displayOrder`);
DROP INDEX `PlayerCategoryLevel_tenantId_name_key` ON `playercategorylevel`;

-- PlayerCategoryAssignment
ALTER TABLE `playercategoryassignment` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `PlayerCategoryAssignment_userId_key` ON `playercategoryassignment`(`userId`);
DROP INDEX `PlayerCategoryAssignment_tenantId_userId_key` ON `playercategoryassignment`;

-- Post
ALTER TABLE `post` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `Post_tenant_idx` ON `post`(`tenantId`);
CREATE INDEX `Post_active_pinned_created_idx` ON `post`(`isActive`, `isPinned`, `createdAt`);
CREATE INDEX `Post_author_idx` ON `post`(`authorId`);
DROP INDEX `Post_tenant_active_pinned_created_idx` ON `post`;
DROP INDEX `Post_tenant_author_idx` ON `post`;

-- PostLike
ALTER TABLE `postlike` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `PostLike_tenantId_idx` ON `postlike`(`tenantId`);
CREATE UNIQUE INDEX `PostLike_post_user_key` ON `postlike`(`postId`, `userId`);
DROP INDEX `PostLike_tenant_post_user_key` ON `postlike`;

-- PostComment
ALTER TABLE `postcomment` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `PostComment_tenant_idx` ON `postcomment`(`tenantId`);
CREATE INDEX `PostComment_post_created_idx` ON `postcomment`(`postId`, `createdAt`);
DROP INDEX `PostComment_tenant_post_created_idx` ON `postcomment`;

-- ChatConversation
ALTER TABLE `chatconversation` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `ChatConversation_tenant_idx` ON `chatconversation`(`tenantId`);
CREATE INDEX `ChatConversation_type_updated_idx` ON `chatconversation`(`type`, `updatedAt`);
DROP INDEX `ChatConversation_tenant_type_updated_idx` ON `chatconversation`;

-- ChatParticipant
ALTER TABLE `chatparticipant` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `ChatParticipant_tenant_idx` ON `chatparticipant`(`tenantId`);
CREATE UNIQUE INDEX `ChatParticipant_conv_user_key` ON `chatparticipant`(`conversationId`, `userId`);
CREATE INDEX `ChatParticipant_user_idx` ON `chatparticipant`(`userId`);
DROP INDEX `ChatParticipant_tenant_conv_user_key` ON `chatparticipant`;
DROP INDEX `ChatParticipant_tenant_user_idx` ON `chatparticipant`;

-- ChatMessage
ALTER TABLE `chatmessage` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `ChatMessage_tenant_idx` ON `chatmessage`(`tenantId`);
CREATE INDEX `ChatMessage_conv_created_idx` ON `chatmessage`(`conversationId`, `createdAt`);
DROP INDEX `ChatMessage_tenant_conv_created_idx` ON `chatmessage`;

-- CommunityNotification
ALTER TABLE `communitynotification` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `CommunityNotification_tenant_idx` ON `communitynotification`(`tenantId`);
CREATE INDEX `CommunityNotification_user_read_created_idx` ON `communitynotification`(`userId`, `isRead`, `createdAt`);
DROP INDEX `CommunityNotification_tenant_user_read_created_idx` ON `communitynotification`;

-- OpenMatch
ALTER TABLE `openmatch` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `OpenMatch_tenant_idx` ON `openmatch`(`tenantId`);
CREATE INDEX `OpenMatch_status_date_idx` ON `openmatch`(`status`, `date`);
CREATE INDEX `OpenMatch_creator_idx` ON `openmatch`(`creatorId`);
DROP INDEX `OpenMatch_tenant_status_date_idx` ON `openmatch`;
DROP INDEX `OpenMatch_tenant_creator_idx` ON `openmatch`;

-- OpenMatchPlayer
ALTER TABLE `openmatchplayer` MODIFY `tenantId` VARCHAR(191) NULL;
CREATE INDEX `OpenMatchPlayer_tenant_idx` ON `openmatchplayer`(`tenantId`);
CREATE UNIQUE INDEX `OpenMatchPlayer_match_user_key` ON `openmatchplayer`(`matchId`, `userId`);
CREATE INDEX `OpenMatchPlayer_user_idx` ON `openmatchplayer`(`userId`);
DROP INDEX `OpenMatchPlayer_tenant_match_user_key` ON `openmatchplayer`;
DROP INDEX `OpenMatchPlayer_tenant_user_idx` ON `openmatchplayer`;
