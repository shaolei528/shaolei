extends Node3D

const Player = preload("res://scripts/player_3d.gd")
const World = preload("res://scripts/world_3d.gd")
const Rig = preload("res://scripts/camera_rig.gd")
const Hud = preload("res://scripts/hud.gd")

var player: CharacterBody3D
var world: Node3D
var rig: Node3D
var hud: CanvasLayer
var qa_elapsed := 0.0

func _ready() -> void:
	world = World.new()
	add_child(world)
	player = Player.new()
	player.position = Vector3(0, 0.1, 4)
	add_child(player)
	world.set_player(player)
	rig = Rig.new()
	rig.target = player
	add_child(rig)
	player.camera = rig.camera
	hud = Hud.new()
	hud.player = player
	hud.world = world
	add_child(hud)

func _process(delta: float) -> void:
	if not OS.has_feature("web") or player == null or hud == null:
		return
	qa_elapsed += delta
	if qa_elapsed < 0.15:
		return
	qa_elapsed = 0.0
	var viewport_size := get_viewport().get_visible_rect().size
	var payload := {
		"player": {"x": player.position.x, "y": player.position.y, "z": player.position.z},
		"collected": world.collected,
		"ember_count": world.crafting.count("ember"),
		"campfire_crafted": world.campfire_crafted,
		"campfire_upgraded": world.campfire_upgraded,
		"campfire_light_range": world.campfire_light.omni_range,
		"campfire_light_energy": world.campfire_light.light_energy,
		"enemy": {
			"x": world.enemy.global_position.x,
			"z": world.enemy.global_position.z,
			"health": world.enemy.health,
			"alive": world.enemy.is_alive
		},
		"ashen_shard_count": world.crafting.count("ashen_shard"),
		"player_health": player.health,
		"player_dodging": player.is_dodging,
		"viewport": {"width": viewport_size.x, "height": viewport_size.y},
		"buttons": hud.button_rects()
	}
	JavaScriptBridge.eval("window.__otherworldQA = " + JSON.stringify(payload) + ";", true)
