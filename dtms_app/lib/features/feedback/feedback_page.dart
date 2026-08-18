import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/errors/api_exception.dart';
import '../../providers/auth_controller.dart';
import '../../providers/providers.dart';

class FeedbackPage extends ConsumerStatefulWidget {
  const FeedbackPage({super.key});

  @override
  ConsumerState<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends ConsumerState<FeedbackPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _department = TextEditingController();
  final _description = TextEditingController();
  String? _year;
  String? _section;
  String? _routeNumber;
  String? _category;
  File? _image;
  bool _submitting = false;

  static const _years = ['1', '2', '3', '4'];
  static const _sections = ['A', 'B', 'C'];
  static const _categories = [
    'General',
    'Issue / Complaint',
    'Driver Behavior',
    'Timing',
    'Safety',
    'Suggestion',
  ];

  @override
  void dispose() {
    _name.dispose();
    _department.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1600);
    if (file != null) setState(() => _image = File(file.path));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_category == null || _year == null || _section == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select category, year and section')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final user = ref.read(currentUserProvider);
      String? imageUrl;
      if (_image != null) {
        imageUrl = await ref
            .read(complaintRepositoryProvider)
            .uploadImage(_image!.path);
      }
      await ref.read(feedbackRepositoryProvider).submit(
            name: _name.text.trim(),
            department: _department.text.trim(),
            year: _year!,
            section: _section!,
            routeNumber: _routeNumber ?? '',
            category: _category!,
            description: _description.text.trim(),
            userId: user?.id,
            imageUrl: imageUrl,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thank you! Feedback submitted.')),
        );
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit feedback')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Submit Feedback')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Name (optional)'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _department,
              decoration: const InputDecoration(labelText: 'Department *'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _year,
                    decoration: const InputDecoration(labelText: 'Year *'),
                    items: _years
                        .map((y) => DropdownMenuItem(value: y, child: Text('Year $y')))
                        .toList(),
                    onChanged: (v) => setState(() => _year = v),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _section,
                    decoration: const InputDecoration(labelText: 'Section *'),
                    items: _sections
                        .map((s) => DropdownMenuItem(value: s, child: Text('Section $s')))
                        .toList(),
                    onChanged: (v) => setState(() => _section = v),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _description,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'Your feedback / complaint *',
                alignLabelWithHint: true,
              ),
              validator: (v) => (v == null || v.trim().length < 5) ? 'Required (min 5 chars)' : null,
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category *'),
              items: _categories
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => setState(() => _category = v),
            ),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.image_outlined),
              label: Text(_image == null ? 'Attach photo (optional)' : 'Change photo'),
            ),
            if (_image != null) ...[
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.file(_image!, height: 120, fit: BoxFit.cover),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              label: const Text('Submit Feedback'),
            ),
            const SizedBox(height: 12),
            Text(
              'Your feedback helps us improve the transport service.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade500 : Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}
