using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UniMeetApi.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedClubIdToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ManagedClubId",
                table: "Users",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ManagedClubId",
                table: "Users");
        }
    }
}
