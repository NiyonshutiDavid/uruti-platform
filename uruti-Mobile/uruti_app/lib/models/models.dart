import '../core/app_constants.dart';

class UserModel {
  final int id;
  final String email;
  final String fullName;
  final String role;
  final String? displayName;
  final String? bio;
  final String? avatarUrl;
  final String? coverImageUrl;
  final String? phone;
  final String? location;
  final String? linkedinUrl;
  final String? twitterUrl;
  final String? websiteUrl;
  final String? title;
  final String? company;
  final int? yearsOfExperience;
  final List<String>? expertise;
  final String? industry;
  final List<String>? preferredSectors;
  final List<String>? investmentFocus;
  final List<String>? achievements;
  final String? fundingAmount;
  final String? stage;
  final bool isActive;
  final bool isVerified;
  final String? createdAt;
  final double uritiScore;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.displayName,
    this.bio,
    this.avatarUrl,
    this.coverImageUrl,
    this.phone,
    this.location,
    this.linkedinUrl,
    this.twitterUrl,
    this.websiteUrl,
    this.title,
    this.company,
    this.yearsOfExperience,
    this.expertise,
    this.industry,
    this.preferredSectors,
    this.investmentFocus,
    this.achievements,
    this.fundingAmount,
    this.stage,
    this.isActive = true,
    this.isVerified = false,
    this.createdAt,
    this.uritiScore = 0.0,
  });

  String get firstName => fullName.trim().split(' ').first;

  bool get isFounder => role == 'founder';
  bool get isInvestor => role == 'investor';
  bool get isMentor => role == 'mentor';
  bool get isAdmin => role == 'admin';

  String get displayNameOrFull => displayName ?? fullName;

  /// Returns a fully-qualified URL for the avatar.
  /// The backend may return a relative path like /uploads/avatar.jpg.
  String? get resolvedAvatarUrl {
    if (avatarUrl == null) return null;
    if (avatarUrl!.startsWith('http')) return avatarUrl;
    return '${AppConstants.apiBaseUrl}$avatarUrl';
  }

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return fullName.substring(0, fullName.length >= 2 ? 2 : 1).toUpperCase();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String>? parseStringList(dynamic val) {
      if (val == null) return null;
      if (val is List) return val.map((e) => e.toString()).toList();
      return null;
    }

    return UserModel(
      id: json['id'] ?? 0,
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? 'founder',
      displayName: json['display_name'],
      bio: json['bio'],
      avatarUrl: json['avatar_url'],
      coverImageUrl: json['cover_image_url'],
      phone: json['phone'],
      location: json['location'],
      linkedinUrl: json['linkedin_url'],
      twitterUrl: json['twitter_url'],
      websiteUrl: json['website_url'],
      title: json['title'],
      company: json['company'],
      yearsOfExperience: json['years_of_experience'],
      expertise: parseStringList(json['expertise']),
      industry: json['industry'],
      preferredSectors: parseStringList(json['preferred_sectors']),
      investmentFocus: parseStringList(json['investment_focus']),
      achievements: parseStringList(json['achievements']),
      fundingAmount: json['funding_amount'],
      stage: json['stage'],
      isActive: json['is_active'] ?? true,
      isVerified: json['is_verified'] ?? false,
      createdAt: json['created_at'],
      uritiScore: (json['uruti_score'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'full_name': fullName,
    'role': role,
    'display_name': displayName,
    'bio': bio,
    'avatar_url': avatarUrl,
    'cover_image_url': coverImageUrl,
    'phone': phone,
    'location': location,
    'linkedin_url': linkedinUrl,
    'twitter_url': twitterUrl,
    'website_url': websiteUrl,
    'title': title,
    'company': company,
    'years_of_experience': yearsOfExperience,
    'expertise': expertise,
    'industry': industry,
    'preferred_sectors': preferredSectors,
    'investment_focus': investmentFocus,
    'achievements': achievements,
    'funding_amount': fundingAmount,
    'stage': stage,
    'is_active': isActive,
    'is_verified': isVerified,
  };

  UserModel copyWith({
    String? displayName,
    String? bio,
    String? avatarUrl,
    String? coverImageUrl,
    String? phone,
    String? location,
    String? title,
    String? company,
  }) {
    return UserModel(
      id: id,
      email: email,
      fullName: fullName,
      role: role,
      displayName: displayName ?? this.displayName,
      bio: bio ?? this.bio,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      phone: phone ?? this.phone,
      location: location ?? this.location,
      linkedinUrl: linkedinUrl,
      twitterUrl: twitterUrl,
      websiteUrl: websiteUrl,
      title: title ?? this.title,
      company: company ?? this.company,
      yearsOfExperience: yearsOfExperience,
      expertise: expertise,
      industry: industry,
      preferredSectors: preferredSectors,
      investmentFocus: investmentFocus,
      achievements: achievements,
      fundingAmount: fundingAmount,
      stage: stage,
      isActive: isActive,
      isVerified: isVerified,
      createdAt: createdAt,
    );
  }
}

class ConnectionModel {
  final int id;
  final UserModel user;
  final String status; // pending, accepted, rejected
  final bool isSender;
  final String? createdAt;

  ConnectionModel({
    required this.id,
    required this.user,
    required this.status,
    required this.isSender,
    this.createdAt,
  });

  factory ConnectionModel.fromJson(
    Map<String, dynamic> json, {
    UserModel? userOverride,
  }) {
    return ConnectionModel(
      id: json['id'] ?? 0,
      user: userOverride ?? UserModel.fromJson(json['user'] ?? json),
      status: json['status'] ?? 'pending',
      isSender: json['is_sender'] ?? false,
      createdAt: json['created_at'],
    );
  }
}

class MessageModel {
  final int id;
  final int senderId;
  final int receiverId;
  final String content;
  final bool isRead;
  final String? createdAt;
  final UserModel? sender;

  MessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    this.isRead = false,
    this.createdAt,
    this.sender,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] ?? 0,
      senderId: json['sender_id'] ?? 0,
      receiverId: json['receiver_id'] ?? 0,
      content: json['content'] ?? '',
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'],
      sender: json['sender'] != null
          ? UserModel.fromJson(json['sender'])
          : null,
    );
  }
}

class NotificationModel {
  final int id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final String? createdAt;
  final Map<String, dynamic>? data;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    this.isRead = false,
    this.createdAt,
    this.data,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'info',
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'],
      data: json['data'],
    );
  }
}
