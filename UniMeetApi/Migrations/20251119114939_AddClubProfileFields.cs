using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMeetApi.Migrations
{
    /// <inheritdoc />
    public partial class AddClubProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FoundedDate",
                table: "Clubs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ManagerId",
                table: "Clubs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "Clubs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                table: "Clubs",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Clubs_ManagerId",
                table: "Clubs",
                column: "ManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clubs_Users_ManagerId",
                table: "Clubs",
                column: "ManagerId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clubs_Users_ManagerId",
                table: "Clubs");

            migrationBuilder.DropIndex(
                name: "IX_Clubs_ManagerId",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "FoundedDate",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "ManagerId",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "Purpose",
                table: "Clubs");
        }
    }
}
