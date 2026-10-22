extends Node3D

var target: Node3D
var camera: Camera3D
var azimuth := 35.0
var elevation := 48.0

func _ready() -> void:
	name = "CameraRig"
	camera = Camera3D.new()
	camera.name = "OrthographicCamera"
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 17.0
	camera.near = 0.1
	camera.far = 80.0
	camera.current = true
	add_child(camera)
	apply_angle()

func apply_angle() -> void:
	var yaw := deg_to_rad(azimuth)
	var pitch := deg_to_rad(elevation)
	camera.position = Vector3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * 24.0
	camera.look_at(global_position, Vector3.UP)

func _process(_delta: float) -> void:
	if target != null:
		global_position = target.global_position + Vector3(0, 0.6, 0)
