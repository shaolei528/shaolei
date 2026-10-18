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
	check(world.crafting.count("ember") == 0, "crafting consumes the ember")
	check(not world.craft_campfire(world.camp_position), "campfire cannot be crafted twice")
	check(not world.interact(world.ember_position), "ember cannot be collected twice")
	print("GODOT_25D_SMOKE=" + JSON.stringify({"passed": failures.is_empty(), "checks": checks.size(), "failures": failures, "engine": Engine.get_version_info().string}))
	scene.queue_free()
	await process_frame
	quit(0 if failures.is_empty() else 1)
