extends SceneTree

var failures: Array[String] = []
var checks: Array[String] = []

func _initialize() -> void:
	call_deferred("run")

func check(condition: bool, description: String) -> void:
	checks.append(description)
	if not condition:
		failures.append(description)

func ticks(count: int) -> void:
	for index in range(count):
		await physics_frame

func run() -> void:
	var scene = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await process_frame
	var player = scene.player
	var world = scene.world
	player.testing = true
	await ticks(45)
	check(player is CharacterBody3D, "player uses CharacterBody3D")
	check(player.hero_sprite is Sprite3D, "hero uses real Sprite3D")
	check(scene.rig.camera.projection == Camera3D.PROJECTION_ORTHOGONAL, "camera uses orthographic 3D projection")
	check(world.get_node("WalkableRamp") is StaticBody3D, "ramp has 3D static collision")
	check(player.is_on_floor() and absf(player.position.y) < 0.08, "player settles on 3D ground")
	var start: Vector3 = player.position
	player.test_direction = Vector3.LEFT
	await ticks(30)
	check(player.position.x < start.x - 1.5, "physics movement crosses ground")
	player.test_direction = Vector3.ZERO
	player.position = Vector3(5.5, 0.1, 4)
	player.velocity = Vector3.ZERO
	await ticks(20)
	player.test_direction = Vector3.RIGHT
	await ticks(60)
	check(player.position.x < 6.55 and player.is_on_wall(), "3D wall blocks movement")
	player.test_direction = Vector3.ZERO
	player.position = Vector3(0, 0.12, 0.6)
	player.velocity = Vector3.ZERO
	await ticks(20)
	player.test_direction = Vector3.FORWARD
	await ticks(100)
	player.test_direction = Vector3.ZERO
	await ticks(15)
	check(player.position.y > 1.1 and player.position.z < -5.0, "player walks up ramp onto raised terrace")
	var base_height: float = player.position.y
	player.jump_requested = true
	await ticks(12)
	check(player.position.y > base_height + 0.4, "jump changes genuine 3D height")
	await ticks(70)
	check(player.is_on_floor(), "jump lands on terrain")
	check(not world.interact(Vector3(10, 0, 10)), "collection rejects out-of-range interaction")
	check(not world.craft_campfire(world.camp_position), "campfire recipe rejects missing ember")
	check(world.interact(world.ember_position), "collection accepts nearby interaction")
	check(world.collected and not world.ember.visible and not world.ember_light.visible, "collection changes world and light state")
	check(world.crafting.count("ember") == 1, "collection adds one ember to inventory")
	check(not world.craft_campfire(Vector3(20, 0, 20)), "crafting rejects a player outside the camp")
	check(world.crafting.count("ember") == 1, "failed crafting preserves ingredients")
	check(world.craft_campfire(world.camp_position), "campfire crafts at the camp work area")
	check(world.campfire_crafted and world.campfire.visible and world.campfire_light.visible, "crafted campfire appears and lights the area")
	check(world.enemy.target == player, "lighting the first campfire awakens the Ashling")
	check(world.crafting.count("ember") == 0, "crafting consumes the ember")
	check(not world.craft_campfire(world.camp_position), "campfire cannot be crafted twice")
	check(not world.upgrade_campfire(world.camp_position), "campfire upgrade rejects missing Ashen Shard")
	check(not world.campfire_upgraded and world.crafting.count("ashen_shard") == 0, "missing upgrade material preserves state and inventory")
	check(not world.upgrade_campfire(Vector3(20, 0, 20)), "campfire upgrade rejects out-of-range player")
	check(world.crafting.count("ashen_shard") == 0, "out-of-range upgrade does not consume material")
	check(not world.interact(world.ember_position), "ember cannot be collected twice")
	world.enemy.testing = true
	player.position = Vector3(4.2, 0.1, 0.5)
	player.velocity = Vector3.ZERO
	player.test_direction = Vector3.ZERO
	await ticks(12)
	check(not world.attack(Vector3(-8, 0, 8)), "melee attack rejects a distant enemy")
	var health_before_dodge: int = player.health
	player.test_direction = Vector3.LEFT
	check(player.request_dodge(), "dodge can start while its cooldown is ready")
	var dodge_start: Vector3 = player.position
	await ticks(5)
	check(player.is_dodging and player.position.x < dodge_start.x - 0.5, "dodge gives a short directional burst")
	check(not player.receive_damage(1) and player.health == health_before_dodge, "dodge window blocks an incoming hit")
	player.test_direction = Vector3.ZERO
	await ticks(18)
	check(not player.is_dodging, "dodge window ends cleanly")
	check(world.attack(player.global_position), "melee attack hits a nearby Ashling")
	check(world.enemy.health == 1 and world.crafting.count("ashen_shard") == 0, "first hit lowers enemy health without dropping early")
	check(world.attack(player.global_position), "second melee attack defeats the Ashling")
	check(not world.enemy.is_alive and not world.enemy.visible, "defeated enemy leaves the encounter")
	check(world.crafting.count("ashen_shard") == 1 and world.ash_shard_drop.visible, "Ashen Shard drop enters the shared inventory and is visible")
	check(not world.attack(player.global_position) and world.crafting.count("ashen_shard") == 1, "defeated enemy cannot be farmed for duplicate drops")
	check(not world.upgrade_campfire(Vector3(20, 0, 20)), "upgrading away from camp is rejected")
	check(world.crafting.count("ashen_shard") == 1, "out-of-range upgrade preserves the Ashen Shard")
	var upgrade_position := world.camp_position + Vector3(2.5, 0, 0)
	check(world.upgrade_campfire(upgrade_position), "campfire upgrade succeeds within interaction range")
	check(world.campfire_upgraded and world.crafting.count("ashen_shard") == 0, "successful upgrade consumes exactly one Ashen Shard")
	check(is_equal_approx(world.campfire_light.omni_range, 8.0) and world.campfire_flame_material.emission == Color("4abfff"), "campfire upgrade visibly increases light and changes flame color")
	check(not world.upgrade_campfire(upgrade_position), "campfire upgrade cannot be crafted twice")
	check(world.crafting.count("ashen_shard") == 0, "duplicate upgrade attempt consumes no extra material")
	print("GODOT_25D_SMOKE=" + JSON.stringify({"passed": failures.is_empty(), "checks": checks.size(), "failures": failures, "engine": Engine.get_version_info().string}))
	scene.queue_free()
	await process_frame
	quit(0 if failures.is_empty() else 1)
