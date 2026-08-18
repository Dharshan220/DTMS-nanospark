import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/errors/api_exception.dart';
import '../../providers/providers.dart';
import '../../theme/app_theme.dart';

class NewComplaintPage extends ConsumerStatefulWidget {
  const NewComplaintPage({super.key});

  @override
  ConsumerState<NewComplaintPage> createState() => _NewComplaintPageState();
}

class _NewComplaintPageState extends ConsumerState<NewComplaintPage> {
  static const _categories = [
    'Late Bus',
    'Cleanliness',
    'Safety',
    'Bus Breakdown',
    'Seat Damage',
    'Route Issue',
    'General Complaint',
    'Suggestion',
  ];

  final _formKey = GlobalKey<FormState>();
  final _description = TextEditingController();
  String? _category;
  int? _routeNumber;
  String? _imageUrl;
  File? _pickedImage;
  bool _submitting = false;

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1600);
    if (file == null) return;
    setState(() => _pickedImage = File(file.path));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      final repo = ref.read(complaintRepositoryProvider);
      if (_pickedImage != null) {
        _imageUrl = await repo.uploadImage(_pickedImage!.path);
      }
      await repo.create(
        category: _category!,
        description: _description.text.trim(),
        routeNumber: _routeNumber,
        imageUrl: _imageUrl,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Complaint submitted! We\'ll keep you updated.')),
        );
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit complaint')),
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
      appBar: AppBar(title: const Text('Raise Complaint')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Category', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _categories
                  .map((c) => ChoiceChip(
                        label: Text(c),
                        selected: _category == c,
                        selectedColor: AppColors.yellow,
                        backgroundColor: isDark ? AppColors.darkGrey : Colors.white,
                        labelStyle: TextStyle(
                          color: _category == c ? AppColors.black : null,
                          fontWeight: _category == c ? FontWeight.w700 : FontWeight.w500,
                        ),
                        onSelected: (_) => setState(() => _category = c),
                      ))
                  .toList(),
            ),
            if (_category == null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  'Select a category',
                  style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _description,
              maxLines: 5,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: 'Describe the issue',
                alignLabelWithHint: true,
                hintText: 'e.g. Bus was 15 minutes late at Padappai stop…',
              ),
              validator: (v) => (v == null || v.trim().length < 5)
                  ? 'Please describe the issue (min 5 chars)'
                  : null,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.image_outlined),
                    label: Text(_pickedImage == null ? 'Add photo' : 'Change photo'),
                  ),
                ),
              ],
            ),
            if (_pickedImage != null) ...[
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.file(_pickedImage!, height: 140, fit: BoxFit.cover),
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
              label: const Text('Submit Complaint'),
            ),
          ],
        ),
      ),
    );
  }
}
