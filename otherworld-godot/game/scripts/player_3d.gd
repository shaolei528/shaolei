extends CharacterBody3D

const SPEED := 4.5
const JUMP_SPEED := 6.0
const DODGE_SPEED := 12.0
const DODGE_DURATION := 0.22
const DODGE_COOLDOWN := 1.0
const MAX_HEALTH := 3
var camera: Camera3D
var touch_direction := Vector2.ZERO
var test_direction := Vector3.ZERO
var testing := false
var jump_requested := false
var health := MAX_HEALTH
var is_dodging := false
var hero_sprite: Sprite3D
var _last_direction := Vector3.RIGHT
var _dodge_direction := Vector3.RIGHT
var _dodge_requested := false
var _dodge_timer := 0.0
var _dodge_cooldown := 0.0
var _damage_grace_timer := 0.0

func _ready() -> void:
	name = "Player3D"
	floor_snap_length = 0.35
	floor_max_angle = deg_to_rad(48.0)
	var shape := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.30
	capsule.height = 1.3
	shape.shape = capsule
	shape.position.y = 0.65
	add_child(shape)
	hero_sprite = Sprite3D.new()
	hero_sprite.name = "HeroSprite"
	hero_sprite.texture = load("res://assets/hero/idle_down_0.png")
	hero_sprite.pixel_size = 0.025
	hero_sprite.position.y = 0.9
	hero_sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	hero_sprite.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
	hero_sprite.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	add_child(hero_sprite)
	var shadow := MeshInstance3D.new()
	var disc := CylinderMesh.new()
	disc.top_radius = 0.34
	disc.bottom_radius = 0.34
	disc.height = 0.012
	shadow.mesh = disc
	shadow.position.y = 0.014
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.04, 0.06, 0.06)
	shadow.material_override = material
	add_child(shadow)

func _physics_process(delta: float) -> void:
	var direction := test_direction if testing else _input_direction()
	_dodge_cooldown = maxf(0.0, _dodge_cooldown - delta)
	_damage_grace_timer = maxf(0.0, _damage_grace_timer - delta)
	if direction.length() > 0.1:
		_last_direction = direction.normalized()
	if _dodge_requested and _dodge_cooldown <= 0.0:
		_dodge_requested = false
		_dodge_timer = DODGE_DURATION
		_dodge_cooldown = DODGE_COOLDOWN
		_damage_grace_timer = DODGE_DURATION + 0.12
		_dodge_direction = _last_direction
	if _dodge_timer > 0.0:
		_dodge_timer = maxf(0.0, _dodge_timer - delta)
		is_dodging = _dodge_timer > 0.0
		velocity.x = _dodge_direction.x * DODGE_SPEED
		velocity.z = _dodge_direction.z * DODGE_SPEED
	else:
		is_dodging = false
		velocity.x = direction.x * SPEED
		velocity.z = direction.z * SPEED
	if not is_on_floor():
		velocity.y -= 18.0 * delta
	if (jump_requested or (not testing and Input.is_physical_key_pressed(KEY_SPACE))) and is_on_floor():
		velocity.y = JUMP_SPEED
	jump_requested = false
	move_and_slide()
	if absf(direction.x) > 0.1:
		hero_sprite.flip_h = direction.x < 0

func request_dodge() -> bool:
	if _dodge_cooldown > 0.0 or _dodge_requested:
		return false
	_dodge_requested = true
	return true

func receive_damage(amount: int) -> bool:
	if amount <= 0 or is_dodging or _damage_grace_timer > 0.0:
		return false
	health = maxi(0, health - amount)
	_damage_grace_timer = 0.45
	if health == 0:
		health = MAX_HEALTH
		global_position = Vector3(0.0, 0.1, 4.0)
		velocity = Vector3.ZERO
		_damage_grace_timer = 1.0
	return true

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and (event.keycode == KEY_SHIFT or event.physical_keycode == KEY_SHIFT):
		request_dodge()

func _input_direction() -> Vector3:
	var stick := touch_direction
	stick.x += float(Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT)) - float(Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT))
	stick.y += float(Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN)) - float(Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP))
	stick = stick.limit_length()
	if camera == null:
		return Vector3(stick.x, 0, stick.y)
	var right := camera.global_basis.x
	var back := camera.global_basis.z
	right.y = 0
	back.y = 0
	return (right.normalized() * stick.x + back.normalized() * stick.y).limit_length()
