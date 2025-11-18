using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMeetApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResetCode",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResetCodeExpiresAt",
                table: "Users",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResetCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ResetCodeExpiresAt",
                table: "Users");
        }
    }
}
