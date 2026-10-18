extends Node3D

signal defeated(drop_id: String)

const DROP_ID := "ashen_shard"
const AGGRO_RADIUS := 5.5
const ATTACK_RADIUS := 1.35
const MELEE_RADIUS := 2.6
const MOVE_SPEED := 1.35
const ATTACK_INTERVAL := 1.35

var target: CharacterBody3D
var health := 2
var max_health := 2
var is_alive := true
var testing := false
var _attack_timer := 0.4
var _body_material: StandardMaterial3D
var _body: MeshInstance3D
var _health_label: Label3D

func _ready() -> void:
	name = "Ashling"
	_body = MeshInstance3D.new()
	_body.name = "Body"
	var body_mesh := SphereMesh.new()
	body_mesh.radius = 0.48
	body_mesh.height = 0.9
	_body.mesh = body_mesh
	_body.position.y = 0.48
	_body_material = StandardMaterial3D.new()
	_body_material.albedo_color = Color("8b705f")
	_body_material.emission_enabled = true
	_body_material.emission = Color("562f31")
	_body.material_override = _body_material
	add_child(_body)
	var eye := MeshInstance3D.new()
	eye.name = "EmberEye"
	var eye_mesh := SphereMesh.new()
	eye_mesh.radius = 0.13
	eye_mesh.height = 0.18
	eye.mesh = eye_mesh
	eye.position = Vector3(0, 0.56, 0.42)
	var eye_material := StandardMaterial3D.new()
	eye_material.albedo_color = Color("ffb45a")
	eye_material.emission_enabled = true
	eye_material.emission = Color("ff632c")
	eye.material_override = eye_material
	add_child(eye)
	_health_label = Label3D.new()
	_health_label.name = "HealthLabel"
	_health_label.position.y = 1.22
	_health_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_health_label.font_size = 32
	_health_label.outline_size = 8
	add_child(_health_label)
	_update_health_label()

func _process(delta: float) -> void:
	if not is_alive or target == null or testing:
		return
	_attack_timer = maxf(0.0, _attack_timer - delta)
	var toward_player := target.global_position - global_position
	toward_player.y = 0.0
	var distance := toward_player.length()
	if distance > AGGRO_RADIUS:
		return
	if distance > ATTACK_RADIUS:
		var travel := minf(MOVE_SPEED * delta, distance - ATTACK_RADIUS * 0.85)
		global_position += toward_player.normalized() * travel
		return
	if _attack_timer <= 0.0:
		target.receive_damage(1)
		_attack_timer = ATTACK_INTERVAL

func attack_from(attacker_position: Vector3) -> bool:
	if not is_alive:
		return false
	var distance := global_position - attacker_position
	distance.y = 0.0
	if distance.length() > MELEE_RADIUS:
		return false
	health = maxi(0, health - 1)
	_update_health_label()
	_body_material.albedo_color = Color("d88968")
	if health == 0:
		is_alive = false
		visible = false
		defeated.emit(DROP_ID)
	return true

func _update_health_label() -> void:
	if _health_label != null:
		_health_label.text = "ASHLING  %d/%d" % [health, max_health]
