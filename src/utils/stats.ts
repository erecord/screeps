export function logRoomStats(room: Room) {
  const energyAvailable = room.energyAvailable;
  const energyCapacity = room.energyCapacityAvailable;
  const roles = _.countBy(Game.creeps, c => c.memory.role);

  console.log(
    JSON.stringify(
      {
        room: room.name,
        energy: `${energyAvailable}/${energyCapacity}`,
        roles,
      },
      null,
      0
    )
  );
}
