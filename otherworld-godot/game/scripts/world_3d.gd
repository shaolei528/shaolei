extends Node3D

const Crafting = preload("res://scripts/crafting_system.gd")
const EnemyController = preload("res://scripts/enemy_controller.gd")

var ember_light: OmniLight3D
var ember: MeshInstance3D
var collected := false
var campfire: Node3D
var campfire_light: OmniLight3D
var campfire_crafted := false
var enemy
var ash_shard_drop: MeshInstance3D
var player_ref: CharacterBody3D
var status := "Find the glowing ember, then craft a campfire at camp."
var ember_position := Vector3(2.8, 0.5, 3.1)
var camp_position := Vector3(-4.6, 0.0, 1.2)
var enemy_position := Vector3(3.8, 0.0, 0.5)
var crafting = Crafting.new()

func _ready() -> void:
	name = "World3D"
	_box("Ground", Vector3(24, 0.5, 24), Vector3(0, -0.25, 0), Color("304e43"))
	_box("NorthTerrace", Vector3(7, 1.3, 4), Vector3(0, 0.65, -7), Color("65715d"))
	var ramp := _box("WalkableRamp", Vector3(3.0, 0.22, 5.25), Vector3(0, 0.57, -2.5), Color("a69a76"))
	ramp.rotation.x = atan(1.3 / 5.0)
	_box("CampCabin", Vector3(2.5, 2, 2), Vector3(-4.6, 1, -1), Color("7c6146"))
	_box("CabinRoof", Vector3(3, 0.28, 2.5), Vector3(-4.6, 2.14, -1), Color("435969"))
	_box("TestWall", Vector3(0.5, 2.0, 3), Vector3(7, 1, 4), Color("74817e"))
	for p in [Vector3(-7,0,4), Vector3(-6,0,-5), Vector3(6,0,-3), Vector3(7,0,-7), Vector3(-3,0,7)]:
		_tree(p)
	for index in range(4):
		_box("TrailStone%d" % index, Vector3(1.2,0.06,0.6), Vector3(-2.8,0.03,3.2-index*1.1), Color("b4af91"), false)
	var environment := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("152731")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("a9c6ce")
	env.ambient_light_energy = 0.7
	environment.environment = env
	add_child(environment)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-55, -30, 0)
	sun.light_color = Color("ffe6b4")
	sun.light_energy = 1.25
	sun.shadow_enabled = true
	add_child(sun)
	ember = MeshInstance3D.new()
	ember.name = "CollectibleEmber"
	var orb := SphereMesh.new()
	orb.radius = 0.23
	orb.height = 0.46
	ember.mesh = orb
	ember.position = ember_position
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("ffbf56")
	material.emission_enabled = true
	material.emission = Color("ff7d2e")
	ember.material_override = material
	add_child(ember)
	ember_light = OmniLight3D.new()
	ember_light.position = ember_position
	ember_light.light_color = Color("ff9f47")
	ember_light.light_energy = 2.5
	ember_light.omni_range = 4.0
	add_child(ember_light)
	_setup_campfire_ghost()
	_setup_enemy()

func _setup_enemy() -> void:
	enemy = EnemyController.new()
	enemy.name = "Ashling"
	enemy.position = enemy_position
	enemy.defeated.connect(_on_enemy_defeated)
	add_child(enemy)

func set_player(player: CharacterBody3D) -> void:
	player_ref = player

func _setup_campfire_ghost() -> void:
	campfire = Node3D.new()
	campfire.name = "CraftedCampfire"
	campfire.position = camp_position
	campfire.visible = false
	add_child(campfire)
	for index in range(6):
		var angle := TAU * float(index) / 6.0
		var stone := MeshInstance3D.new()
		var rock := SphereMesh.new()
		rock.radius = 0.22
		rock.height = 0.2
		stone.mesh = rock
		stone.position = Vector3(cos(angle) * 0.42, 0.12, sin(angle) * 0.42)
		var stone_material := StandardMaterial3D.new()
		stone_material.albedo_color = Color("77736a")
		stone.material_override = stone_material
		campfire.add_child(stone)
	var flame := MeshInstance3D.new()
	flame.name = "FireCore"
	var fire_mesh := SphereMesh.new()
	fire_mesh.radius = 0.25
	fire_mesh.height = 0.6
	flame.mesh = fire_mesh
	flame.position.y = 0.38
	var fire_material := StandardMaterial3D.new()
	fire_material.albedo_color = Color("ff9c3a")
	fire_material.emission_enabled = true
	fire_material.emission = Color("ff6b22")
	flame.material_override = fire_material
	campfire.add_child(flame)
	campfire_light = OmniLight3D.new()
	campfire_light.position.y = 0.5
	campfire_light.light_color = Color("ff9140")
	campfire_light.light_energy = 1.8
	campfire_light.omni_range = 5.0
	campfire.add_child(campfire_light)

func _box(label: String, size: Vector3, origin: Vector3, color: Color, collision := true) -> Node3D:
	var body: Node3D = StaticBody3D.new() if collision else Node3D.new()
	body.name = label
	body.position = origin
	add_child(body)
	var visual := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	visual.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	visual.material_override = material
	body.add_child(visual)
	if collision:
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = size
		shape.shape = box
		body.add_child(shape)
	return body

func _tree(origin: Vector3) -> void:
	_box("TreeTrunk", Vector3(0.5, 2.2, 0.5), origin + Vector3(0,1.1,0), Color("68543e"))
	var visual := MeshInstance3D.new()
	var crown := CylinderMesh.new()
	crown.top_radius = 0.1
	crown.bottom_radius = 1.25
	crown.height = 2.5
	crown.radial_segments = 8
	visual.mesh = crown
	visual.position = origin + Vector3(0,2.7,0)
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("377768")
	visual.material_override = material
	add_child(visual)

func interact(player_position: Vector3) -> bool:
	if collected:
		status = "Ember already recovered. Explore the elevated northern terrace."
		return false
	if player_position.distance_to(ember_position) > 2.0:
		status = "Move closer to the glowing ember (gold orb)."
		return false
	collected = true
	crafting.add_item("ember")
	ember.visible = false
	ember_light.visible = false
	status = "Ember +1 · Return to camp and craft a campfire."
	return true

func craft_campfire(player_position: Vector3) -> bool:
	if campfire_crafted:
		status = "The campfire is already built."
		return false
	if player_position.distance_to(camp_position) > 3.0:
		status = "Return to the camp work area to build."
		return false
	if not crafting.craft("campfire"):
		status = "Need one glowing ember to build a campfire."
		return false
	campfire_crafted = true
	campfire.visible = true
	enemy.target = player_ref
	status = "Campfire built · Ember 0 · The fire draws an Ashling nearby."
	return true

func attack(player_position: Vector3) -> bool:
	if not enemy.attack_from(player_position):
		status = "Move closer to the Ashling before striking."
		return false
	if enemy.is_alive:
		status = "Ashling hit · %d/%d HP." % [enemy.health, enemy.max_health]
	else:
		status = "Ashling defeated · Ashen Shard +1."
	return true

func _on_enemy_defeated(drop_id: String) -> void:
	crafting.add_item(drop_id)
	ash_shard_drop = MeshInstance3D.new()
	ash_shard_drop.name = "AshenShardDrop"
	var shard := SphereMesh.new()
	shard.radius = 0.2
	shard.height = 0.56
	ash_shard_drop.mesh = shard
	ash_shard_drop.position = enemy.global_position + Vector3(0, 0.32, 0)
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("b48eff")
	material.emission_enabled = true
	material.emission = Color("794dff")
	ash_shard_drop.material_override = material
	add_child(ash_shard_drop)
