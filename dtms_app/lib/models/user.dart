enum UserRole {
  admin('admin', 'Super Admin'),
  student('student', 'Student'),
  teacher('teacher', 'Teacher'),
  parent('parent', 'Parent');

  const UserRole(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static UserRole fromApi(String? value) {
    return UserRole.values.firstWhere(
      (r) => r.apiValue == value,
      orElse: () => UserRole.student,
    );
  }
}

class User {
  final String id;
  final UserRole role;
  final String name;
  final String? email;
  final String? phone;
  final String? department;
  final String? year;
  final String? section;
  final String? rollNo;
  final int? routeNumber;
  final String? boardingStop;
  final bool isBusAdmin;
  final List<String> childIds;
  final String? photoUrl;
  final bool active;

  const User({
    required this.id,
    required this.role,
    required this.name,
    this.email,
    this.phone,
    this.department,
    this.year,
    this.section,
    this.rollNo,
    this.routeNumber,
    this.boardingStop,
    this.isBusAdmin = false,
    this.childIds = const [],
    this.photoUrl,
    this.active = true,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id']?.toString() ?? '',
        role: UserRole.fromApi(json['role']?.toString()),
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString(),
        phone: json['phone']?.toString(),
        department: json['department']?.toString(),
        year: json['year']?.toString(),
        section: json['section']?.toString(),
        rollNo: json['rollNo']?.toString(),
        routeNumber: (json['routeNumber'] as num?)?.toInt(),
        boardingStop: json['boardingStop']?.toString(),
        isBusAdmin: json['isBusAdmin'] == true,
        childIds: (json['childIds'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        photoUrl: json['photoUrl']?.toString(),
        active: json['active'] != false,
      );
}
