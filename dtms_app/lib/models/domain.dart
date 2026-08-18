class ComplaintStatusUpdate {
  final String status;
  final int at;
  final String by;

  const ComplaintStatusUpdate({required this.status, required this.at, required this.by});

  factory ComplaintStatusUpdate.fromJson(Map<String, dynamic> json) => ComplaintStatusUpdate(
        status: json['status']?.toString() ?? '',
        at: (json['at'] as num?)?.toInt() ?? 0,
        by: json['by']?.toString() ?? '',
      );
}

class Complaint {
  final String id;
  final String userId;
  final String name;
  final String role;
  final String category;
  final String? busId;
  final int? routeNumber;
  final String description;
  final String? imageUrl;
  final String status; // pending | in_progress | resolved
  final String adminResponse;
  final List<ComplaintStatusUpdate> history;
  final int createdAt;
  final int updatedAt;

  const Complaint({
    required this.id,
    required this.userId,
    required this.name,
    required this.role,
    required this.category,
    this.busId,
    this.routeNumber,
    required this.description,
    this.imageUrl,
    required this.status,
    this.adminResponse = '',
    this.history = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) => Complaint(
        id: json['id']?.toString() ?? '',
        userId: json['userId']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        role: json['role']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        busId: json['busId']?.toString(),
        routeNumber: (json['routeNumber'] as num?)?.toInt(),
        description: json['description']?.toString() ?? '',
        imageUrl: json['imageUrl']?.toString(),
        status: json['status']?.toString() ?? 'pending',
        adminResponse: json['adminResponse']?.toString() ?? '',
        history: (json['history'] as List?)
                ?.map((e) => ComplaintStatusUpdate.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
        createdAt: (json['createdAt'] as num?)?.toInt() ?? 0,
        updatedAt: (json['updatedAt'] as num?)?.toInt() ?? 0,
      );
}

class FeedbackEntry {
  final String id;
  final String? userId;
  final String name;
  final String department;
  final String year;
  final String section;
  final String routeNumber;
  final String category;
  final String description;
  final String? imageUrl;
  final String timestamp;

  const FeedbackEntry({
    required this.id,
    this.userId,
    required this.name,
    required this.department,
    required this.year,
    required this.section,
    required this.routeNumber,
    required this.category,
    required this.description,
    this.imageUrl,
    required this.timestamp,
  });

  factory FeedbackEntry.fromJson(Map<String, dynamic> json) => FeedbackEntry(
        id: json['id']?.toString() ?? '',
        userId: json['userId']?.toString(),
        name: json['name']?.toString() ?? '',
        department: json['department']?.toString() ?? '',
        year: json['year']?.toString() ?? '',
        section: json['section']?.toString() ?? '',
        routeNumber: json['routeNumber']?.toString() ?? '',
        category: json['category']?.toString() ?? '',
        description: json['description']?.toString() ?? '',
        imageUrl: json['imageUrl']?.toString(),
        timestamp: json['timestamp']?.toString() ?? '',
      );
}

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool read;
  final int createdAt;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.read,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) => NotificationItem(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        body: json['body']?.toString() ?? '',
        type: json['type']?.toString() ?? '',
        read: json['read'] == true,
        createdAt: (json['createdAt'] as num?)?.toInt() ?? 0,
      );
}

class AttendanceRecord {
  final String id;
  final String studentId;
  final String date;
  final String status;
  final String? checkInAt;
  final String? checkInStop;

  const AttendanceRecord({
    required this.id,
    required this.studentId,
    required this.date,
    required this.status,
    this.checkInAt,
    this.checkInStop,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) => AttendanceRecord(
        id: json['id']?.toString() ?? '',
        studentId: json['studentId']?.toString() ?? '',
        date: json['date']?.toString() ?? '',
        status: json['status']?.toString() ?? 'present',
        checkInAt: json['checkInAt']?.toString(),
        checkInStop: json['checkInStop']?.toString(),
      );
}
